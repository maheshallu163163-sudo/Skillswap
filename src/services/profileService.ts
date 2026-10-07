import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';
import { DatabaseService } from './db';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface CropArea {
  x: number; // percentage or pixels
  y: number;
  scale: number; // zoom factor (1 = 100%, 2 = 200%, etc.)
}

export const ProfileService = {
  /**
   * Fetch user profile by ID (either from Supabase or local DatabaseService)
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id || data.user_id,
          userId: data.user_id,
          fullName: data.full_name || 'Member',
          email: data.email || '',
          avatarUrl: data.avatar_url || '',
          city: data.city || '',
          country: data.country || '',
          bio: data.bio || '',
          experience: data.experience || '',
          languages: data.languages || ['English'],
          learningMode: data.learning_mode || 'online',
          availability: data.availability || ['Weekday evenings'],
          learningGoals: data.learning_goals || '',
          points: data.points ?? 50,
          rating: Number(data.rating || 5.0),
          reviewCount: data.review_count || 0,
          completedSwapsCount: data.completed_swaps_count || 0,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
          skills: [],
        };
      }
    }

    return await DatabaseService.getUserById(userId);
  },

  /**
   * Update profile fields
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const updatedUser = await DatabaseService.updateProfile({
      id: userId,
      ...updates,
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.fullName !== undefined) payload.full_name = updates.fullName;
        if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
        if (updates.bio !== undefined) payload.bio = updates.bio;
        if (updates.city !== undefined) payload.city = updates.city;
        if (updates.experience !== undefined) payload.experience = updates.experience;
        if (updates.learningGoals !== undefined) payload.learning_goals = updates.learningGoals;
        if (updates.languages !== undefined) payload.languages = updates.languages;
        if (updates.learningMode !== undefined) payload.learning_mode = updates.learningMode;
        if (updates.availability !== undefined) payload.availability = updates.availability;

        await supabase.from('profiles').update(payload).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase profile sync warning:', err);
      }
    }

    return updatedUser;
  },

  /**
   * Validate image file size and MIME type
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Please choose an image file.' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: 'Unsupported image format. Please select a JPG, PNG, or WEBP image.',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Image size is ${sizeMb} MB. The maximum allowed file size is 5 MB.`,
      };
    }

    return { valid: true };
  },

  /**
   * Crop and compress image to 512x512 JPEG/WebP blob
   */
  async cropAndCompressImage(
    imageSrc: string,
    crop: CropArea,
    outputDimension: number = 512
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = outputDimension;
          canvas.height = outputDimension;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas context could not be created'));
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Calculate dimensions with zoom & center offset
          const minSide = Math.min(img.naturalWidth, img.naturalHeight);
          const scaledSize = minSide / (crop.scale || 1);

          // Center coordinate based on pan/crop
          const centerX = (img.naturalWidth / 2) - (crop.x * (img.naturalWidth / 2));
          const centerY = (img.naturalHeight / 2) - (crop.y * (img.naturalHeight / 2));

          const sourceX = Math.max(0, Math.min(img.naturalWidth - scaledSize, centerX - scaledSize / 2));
          const sourceY = Math.max(0, Math.min(img.naturalHeight - scaledSize, centerY - scaledSize / 2));

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            scaledSize,
            scaledSize,
            0,
            0,
            outputDimension,
            outputDimension
          );

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image into blob'));
              }
            },
            'image/jpeg',
            0.92
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Unable to process the selected image'));
      };

      img.src = imageSrc;
    });
  },

  /**
   * Upload an avatar blob to Supabase Storage and persist to profiles.avatar_url
   */
  async uploadAvatar(
    userId: string,
    blob: Blob,
    existingAvatarUrl?: string | null
  ): Promise<string> {
    if (!userId) {
      throw new Error('Authentication required to upload a profile photo.');
    }

    const timestamp = Date.now();
    const fileName = `avatar-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    if (isSupabaseConfigured && supabase) {
      // 1. Upload to Supabase Storage bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw new Error('Unable to upload photo to storage. Please check permissions and try again.');
      }

      // 2. Retrieve public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const basePublicUrl = publicUrlData.publicUrl;
      // Append cache-busting timestamp to guarantee immediate browser refresh
      const finalAvatarUrl = `${basePublicUrl}?t=${timestamp}`;

      // 3. Update database profiles.avatar_url
      await this.updateProfile(userId, { avatarUrl: finalAvatarUrl });

      // 4. Clean up old avatar files in this user's folder (asynchronously, non-blocking)
      this.cleanupOldAvatars(userId, fileName).catch((err) => {
        console.warn('Old avatar cleanup notice:', err);
      });

      return finalAvatarUrl;
    }

    // Local / Offline fallback mode:
    // Convert blob to Data URI and save to local persistent DatabaseService
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result as string;
          await this.updateProfile(userId, { avatarUrl: dataUrl });
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image buffer'));
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Remove profile photo
   */
  async deleteAvatar(userId: string, currentAvatarUrl?: string | null): Promise<void> {
    if (!userId) throw new Error('Authentication required.');

    // 1. Update database profiles.avatar_url to empty
    await this.updateProfile(userId, { avatarUrl: '' });

    // 2. If Supabase is active, remove files from storage
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: fileList } = await supabase.storage.from('avatars').list(userId);
        if (fileList && fileList.length > 0) {
          const filePaths = fileList.map((f) => `${userId}/${f.name}`);
          await supabase.storage.from('avatars').remove(filePaths);
        }
      } catch (err) {
        console.warn('Storage file deletion notice:', err);
      }
    }
  },

  /**
   * Helper to remove previous avatars in the user's storage folder
   */
  async cleanupOldAvatars(userId: string, currentFileName: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: fileList } = await supabase.storage.from('avatars').list(userId);
      if (fileList && fileList.length > 1) {
        const oldFiles = fileList
          .filter((f) => f.name !== currentFileName)
          .map((f) => `${userId}/${f.name}`);
        if (oldFiles.length > 0) {
          await supabase.storage.from('avatars').remove(oldFiles);
        }
      }
    } catch {
      // Non-fatal
    }
  },
};
