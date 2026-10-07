import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProfileService, CropArea } from '../services/profileService';
import { UserAvatar } from './UserAvatar';
import { Modal } from './Modal';
import {
  Camera,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface ProfilePhotoUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newAvatarUrl: string) => void;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, refreshProfile, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, scale: 1 });
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Handle native file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type & size
    const validation = ProfileService.validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setCrop({ x: 0, y: 0, scale: 1 });

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Reset file selection back to idle
  const handleCancelSelection = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save / Upload Photo
  const handleSavePhoto = async () => {
    if (!currentUser || !imagePreviewUrl) return;

    try {
      setUploading(true);
      setErrorMessage(null);

      // 1. Crop and compress image into 512x512 JPEG blob
      const compressedBlob = await ProfileService.cropAndCompressImage(
        imagePreviewUrl,
        crop,
        512
      );

      // 2. Upload to Supabase Storage & update database profiles.avatar_url
      const newAvatarUrl = await ProfileService.uploadAvatar(
        currentUser.id,
        compressedBlob,
        currentUser.avatarUrl
      );

      // 3. Update global context & refresh
      await updateUser({ avatarUrl: newAvatarUrl });
      await refreshProfile();

      fireCelebrationConfetti();
      setSuccessToast('Profile photo updated successfully.');

      if (onSuccess) onSuccess(newAvatarUrl);

      setTimeout(() => {
        handleCancelSelection();
        setSuccessToast(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Avatar upload failure:', err);
      setErrorMessage(
        err.message || 'Unable to upload your photo. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  // Remove Photo action
  const handleRemovePhoto = async () => {
    if (!currentUser) return;
    try {
      setRemoving(true);
      setErrorMessage(null);

      await ProfileService.deleteAvatar(currentUser.id, currentUser.avatarUrl);
      await updateUser({ avatarUrl: '' });
      await refreshProfile();

      setConfirmRemoveOpen(false);
      setSuccessToast('Profile photo removed.');

      if (onSuccess) onSuccess('');

      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Avatar removal failure:', err);
      setErrorMessage('Could not remove photo. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const hasPhoto = Boolean(currentUser?.avatarUrl && currentUser.avatarUrl.trim());

  return (
    <>
      <Modal
        isOpen={isOpen && !confirmRemoveOpen}
        onClose={onClose}
        title={selectedFile ? 'Adjust & Preview Photo' : 'Manage Profile Photo'}
        subtitle={
          selectedFile
            ? 'Zoom and frame your photo. It will appear across SkillSwap.'
            : 'Your photo helps learning partners recognize you.'
        }
        maxWidth="md"
      >
        <div className="space-y-6">
          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Success Notification */}
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* VIEW A: Cropper & Preview (When an image is picked)           */}
          {/* ------------------------------------------------------------- */}
          {selectedFile && imagePreviewUrl ? (
            <div className="space-y-5 animate-fade-in">
              {/* Circular preview container */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-indigo-500 shadow-xl bg-slate-900 flex items-center justify-center">
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    style={{
                      transform: `scale(${crop.scale}) translate(${crop.x * 30}%, ${crop.y * 30}%)`,
                      transformOrigin: 'center center',
                    }}
                    className="max-w-none w-full h-full object-cover transition-transform duration-75"
                  />
                  {/* Subtle circular boundary ring */}
                  <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none" />
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-3">
                  Circular Avatar View
                </p>
              </div>

              {/* Zoom & Positioning Controls */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
                    Zoom & Scale
                  </span>
                  <span className="text-slate-400 font-mono">
                    {Math.round(crop.scale * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCrop((prev) => ({
                        ...prev,
                        scale: Math.max(1, Number((prev.scale - 0.1).toFixed(1))),
                      }))
                    }
                    className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={crop.scale}
                    onChange={(e) =>
                      setCrop((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setCrop((prev) => ({
                        ...prev,
                        scale: Math.min(2.5, Number((prev.scale + 0.1).toFixed(1))),
                      }))
                    }
                    className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCrop({ x: 0, y: 0, scale: 1 })}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-500"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  disabled={uploading}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading profile photo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ------------------------------------------------------------- */
            /* VIEW B: Idle State (Change or Remove Existing Photo)          */
            /* ------------------------------------------------------------- */
            <div className="space-y-6 text-center">
              {/* Current Avatar Display */}
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <UserAvatar
                    src={currentUser?.avatarUrl}
                    name={currentUser?.fullName}
                    size="2xl"
                    shape="circle"
                    className="border-4 border-indigo-100 shadow-xl group-hover:ring-4 group-hover:ring-indigo-300 transition-all"
                  />
                  <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold">
                    <Camera className="w-6 h-6 mb-1" />
                    <span>Change</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="text-base font-bold text-slate-900">
                    {currentUser?.fullName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {hasPhoto ? 'Custom profile photo active' : 'Default initials avatar active'}
                  </p>
                </div>
              </div>

              {/* Main Actions */}
              <div className="space-y-3 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span>{hasPhoto ? 'Change Photo' : 'Upload New Photo'}</span>
                </button>

                {hasPhoto && (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Format & Size Requirements Notice */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
                Supports <span className="font-semibold text-slate-600">JPG, PNG, or WEBP</span> • Maximum file size <span className="font-semibold text-slate-600">5 MB</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal for Removal (Section 10) */}
      <Modal
        isOpen={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        title="Remove your profile photo?"
        subtitle="Your avatar will revert to your generated initials."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to remove your custom photo? This action will permanently remove it from your profile.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmRemoveOpen(false)}
              disabled={removing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={removing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5"
            >
              {removing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
