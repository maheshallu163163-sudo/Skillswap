import {
  UserProfile,
  UserSkill,
  SwapRequest,
  Session,
  Review,
  Conversation,
  Message,
  Badge,
  UserBadge,
  PointsTransaction,
  LearningPlan,
  AppNotification,
  CallRecord,
  LearningRoom,
  RoomMember,
  RoomResource,
  RoomMessage,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_SWAP_REQUESTS,
  INITIAL_SESSIONS,
  INITIAL_REVIEWS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  MASTER_BADGES,
  INITIAL_CALLS,
  INITIAL_ROOMS,
  INITIAL_ROOM_MEMBERS,
  INITIAL_ROOM_MESSAGES,
  INITIAL_ROOM_RESOURCES,
} from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  USERS: 'skillswap_users_v1',
  CURRENT_USER_ID: 'skillswap_curr_user_id',
  SWAP_REQUESTS: 'skillswap_requests_v1',
  SESSIONS: 'skillswap_sessions_v1',
  REVIEWS: 'skillswap_reviews_v1',
  CONVERSATIONS: 'skillswap_conversations_v1',
  MESSAGES: 'skillswap_messages_v1',
  BADGES: 'skillswap_user_badges_v1',
  TRANSACTIONS: 'skillswap_transactions_v1',
  PLANS: 'skillswap_learning_plans_v1',
  NOTIFICATIONS: 'skillswap_notifications_v1',
  CALLS: 'skillswap_calls_v1',
  ROOMS: 'skillswap_rooms_v1',
  ROOM_MEMBERS: 'skillswap_room_members_v1',
  ROOM_MESSAGES: 'skillswap_room_messages_v1',
  ROOM_RESOURCES: 'skillswap_room_resources_v1',
};

// Event listener mechanism for local real-time reactivity
type ListenerCallback = (data: any) => void;
const listeners: Record<string, Set<ListenerCallback>> = {};

function notifyListeners(channel: string, payload: any) {
  if (listeners[channel]) {
    listeners[channel].forEach((cb) => cb(payload));
  }
}

export function subscribeToChannel(channel: string, cb: ListenerCallback): () => void {
  if (!listeners[channel]) {
    listeners[channel] = new Set();
  }
  listeners[channel].add(cb);
  return () => {
    listeners[channel]?.delete(cb);
  };
}

// Local Storage Helper
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage quota exceeded or error:', err);
  }
}

// Database Service Implementation
export class DatabaseService {
  // -------------------------------------------------------------
  // PROFILES & USERS
  // -------------------------------------------------------------
  static async getUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return getStored<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static async getUserById(userId: string): Promise<UserProfile | null> {
    const users = await this.getUsers();
    return users.find((u) => u.id === userId || u.userId === userId) || null;
  }

  static async updateProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === profile.id);
    if (index === -1) throw new Error('User not found');

    const updated = {
      ...users[index],
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    users[index] = updated;
    setStored(STORAGE_KEYS.USERS, users);
    notifyListeners('profiles', updated);
    return updated;
  }

  static async updateUser(profile: UserProfile): Promise<UserProfile> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === profile.id || u.userId === profile.userId);
    if (index === -1) {
      return this.createUserProfile(profile);
    }
    return this.updateProfile(profile);
  }

  static async createUserProfile(newProfile: UserProfile): Promise<UserProfile> {
    const users = await this.getUsers();
    users.unshift(newProfile);
    setStored(STORAGE_KEYS.USERS, users);
    // Award initial profile setup points & badge
    await this.addPoints(newProfile.id, 50, 'Completed initial profile setup');
    notifyListeners('profiles', newProfile);
    return newProfile;
  }

  // -------------------------------------------------------------
  // SKILLS MANAGEMENT
  // -------------------------------------------------------------
  static async addSkill(userId: string, skill: Omit<UserSkill, 'id' | 'userId'>): Promise<UserProfile> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const newSkill: UserSkill = {
      ...skill,
      id: `sk-${Date.now()}`,
      userId,
    };

    const currentSkills = user.skills || [];
    const updatedUser = await this.updateProfile({
      id: user.id,
      skills: [...currentSkills, newSkill],
    });

    await this.addPoints(userId, 10, `Added skill: ${skill.name}`);
    return updatedUser;
  }

  static async removeSkill(userId: string, skillId: string): Promise<UserProfile> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const updatedSkills = (user.skills || []).filter((s) => s.id !== skillId);
    return await this.updateProfile({
      id: user.id,
      skills: updatedSkills,
    });
  }

  static async updateSkill(userId: string, skillId: string, updates: Partial<UserSkill>): Promise<UserProfile> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const updatedSkills = (user.skills || []).map((s) => (s.id === skillId ? { ...s, ...updates } : s));
    return await this.updateProfile({
      id: user.id,
      skills: updatedSkills,
    });
  }

  // -------------------------------------------------------------
  // SWAP REQUESTS
  // -------------------------------------------------------------
  static async getSwapRequests(userId: string): Promise<SwapRequest[]> {
    const requests = getStored<SwapRequest[]>(STORAGE_KEYS.SWAP_REQUESTS, INITIAL_SWAP_REQUESTS);
    const users = await this.getUsers();

    return requests
      .filter((r) => r.senderId === userId || r.receiverId === userId)
      .map((r) => ({
        ...r,
        senderProfile: users.find((u) => u.id === r.senderId),
        receiverProfile: users.find((u) => u.id === r.receiverId),
      }));
  }

  static async createSwapRequest(
    senderId: string,
    receiverId: string,
    teachSkillName: string,
    learnSkillName: string,
    message: string
  ): Promise<SwapRequest> {
    const requests = getStored<SwapRequest[]>(STORAGE_KEYS.SWAP_REQUESTS, INITIAL_SWAP_REQUESTS);
    const users = await this.getUsers();
    const sender = users.find((u) => u.id === senderId);

    const newRequest: SwapRequest = {
      id: `req-${Date.now()}`,
      senderId,
      receiverId,
      teachSkillId: `s-${teachSkillName.toLowerCase().replace(/\s+/g, '-')}`,
      teachSkillName,
      learnSkillId: `s-${learnSkillName.toLowerCase().replace(/\s+/g, '-')}`,
      learnSkillName,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requests.unshift(newRequest);
    setStored(STORAGE_KEYS.SWAP_REQUESTS, requests);

    // Send notification to receiver
    await this.createNotification(
      receiverId,
      'New Swap Request',
      `${sender?.fullName || 'A member'} sent you a skill swap request for ${teachSkillName} ↔ ${learnSkillName}.`,
      'request',
      '/requests'
    );

    notifyListeners('requests', newRequest);
    return newRequest;
  }

  static async updateSwapRequestStatus(
    requestId: string,
    status: SwapRequest['status'],
    userId: string
  ): Promise<SwapRequest> {
    const requests = getStored<SwapRequest[]>(STORAGE_KEYS.SWAP_REQUESTS, INITIAL_SWAP_REQUESTS);
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Request not found');

    const req = requests[index];
    req.status = status;
    req.updatedAt = new Date().toISOString();
    requests[index] = req;
    setStored(STORAGE_KEYS.SWAP_REQUESTS, requests);

    if (status === 'accepted') {
      // Auto create or find conversation
      await this.getOrCreateConversation(req.senderId, req.receiverId);

      // Award points for accepting swap
      await this.addPoints(req.receiverId, 30, 'Accepted a skill swap request');
      await this.addPoints(req.senderId, 30, 'Swap request was accepted');

      // Check first swap badge
      await this.checkAndAwardBadge(req.senderId, 'b-first-swap');
      await this.checkAndAwardBadge(req.receiverId, 'b-first-swap');

      // Create notification
      await this.createNotification(
        req.senderId,
        'Swap Request Accepted! 🎉',
        `Your skill swap request with ${req.teachSkillName} was accepted! You can now start chatting and schedule a session.`,
        'request',
        '/requests'
      );
    }

    notifyListeners('requests', req);
    return req;
  }

  // -------------------------------------------------------------
  // CONVERSATIONS & REALTIME MESSAGING
  // -------------------------------------------------------------
  static async getConversations(userId: string): Promise<Conversation[]> {
    const convs = getStored<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
    const users = await this.getUsers();

    return convs
      .filter((c) => c.participantIds.includes(userId))
      .map((c) => {
        const otherId = c.participantIds.find((id) => id !== userId);
        return {
          ...c,
          otherUser: users.find((u) => u.id === otherId),
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
  }

  static async getOrCreateConversation(userA: string, userB: string): Promise<Conversation> {
    const convs = getStored<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
    const existing = convs.find(
      (c) => c.participantIds.includes(userA) && c.participantIds.includes(userB)
    );

    if (existing) return existing;

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      participantIds: [userA, userB],
      lastMessage: 'Conversation started',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    convs.unshift(newConv);
    setStored(STORAGE_KEYS.CONVERSATIONS, convs);
    notifyListeners('conversations', newConv);
    return newConv;
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    const messages = getStored<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    return messages.filter((m) => m.conversationId === conversationId);
  }

  static async sendMessage(conversationId: string, senderId: string, receiverId: string, content: string): Promise<Message> {
    const messages = getStored<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const convs = getStored<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      receiverId,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    messages.push(newMsg);
    setStored(STORAGE_KEYS.MESSAGES, messages);

    // Update conversation last message
    const convIndex = convs.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      convs[convIndex].lastMessage = content;
      convs[convIndex].lastMessageAt = newMsg.createdAt;
      setStored(STORAGE_KEYS.CONVERSATIONS, convs);
      notifyListeners('conversations', convs[convIndex]);
    }

    notifyListeners(`messages-${conversationId}`, newMsg);
    return newMsg;
  }

  // -------------------------------------------------------------
  // SESSIONS
  // -------------------------------------------------------------
  static async getSessions(userId: string): Promise<Session[]> {
    const sessions = getStored<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    const users = await this.getUsers();

    return sessions
      .filter((s) => s.teacherId === userId || s.learnerId === userId)
      .map((s) => ({
        ...s,
        teacherProfile: users.find((u) => u.id === s.teacherId),
        learnerProfile: users.find((u) => u.id === s.learnerId),
      }))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  static async createSession(data: Omit<Session, 'id' | 'createdAt' | 'status'>): Promise<Session> {
    const sessions = getStored<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);

    const newSession: Session = {
      ...data,
      id: `sess-${Date.now()}`,
      status: 'scheduled',
      completedByTeacher: false,
      completedByLearner: false,
      createdAt: new Date().toISOString(),
    };

    sessions.unshift(newSession);
    setStored(STORAGE_KEYS.SESSIONS, sessions);

    // Notify other participant
    const recipient = data.teacherId === data.learnerId ? data.teacherId : data.learnerId;
    await this.createNotification(
      recipient,
      'New Session Scheduled 📅',
      `Session for ${data.skillName} scheduled on ${new Date(data.scheduledAt).toLocaleString()}`,
      'session',
      '/sessions'
    );

    notifyListeners('sessions', newSession);
    return newSession;
  }

  static async completeSession(sessionId: string, userId: string): Promise<Session> {
    const sessions = getStored<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    const index = sessions.findIndex((s) => s.id === sessionId);
    if (index === -1) throw new Error('Session not found');

    const session = sessions[index];
    if (session.teacherId === userId) session.completedByTeacher = true;
    if (session.learnerId === userId) session.completedByLearner = true;

    // If marked by either or both, mark completed and award points
    session.status = 'completed';
    sessions[index] = session;
    setStored(STORAGE_KEYS.SESSIONS, sessions);

    // Award +50 points to both users
    await this.addPoints(session.teacherId, 50, `Completed teaching session: ${session.skillName}`);
    await this.addPoints(session.learnerId, 50, `Completed learning session: ${session.skillName}`);

    // Update user completedSwapsCount
    const users = await this.getUsers();
    const teacher = users.find((u) => u.id === session.teacherId);
    if (teacher) {
      await this.updateProfile({ id: teacher.id, completedSwapsCount: (teacher.completedSwapsCount || 0) + 1 });
      await this.checkAndAwardBadge(teacher.id, 'b-fast-learner');
    }

    const learner = users.find((u) => u.id === session.learnerId);
    if (learner) {
      await this.updateProfile({ id: learner.id, completedSwapsCount: (learner.completedSwapsCount || 0) + 1 });
      await this.checkAndAwardBadge(learner.id, 'b-fast-learner');
    }

    notifyListeners('sessions', session);
    return session;
  }

  // -------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------
  static async getReviews(revieweeId?: string): Promise<Review[]> {
    const reviews = getStored<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    if (revieweeId) {
      return reviews.filter((r) => r.revieweeId === revieweeId);
    }
    return reviews;
  }

  static async addReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const reviews = getStored<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);

    // Check duplicate
    const exists = reviews.some(
      (r) => r.sessionId === reviewData.sessionId && r.reviewerId === reviewData.reviewerId
    );
    if (exists) {
      throw new Error('You have already submitted a review for this session.');
    }

    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    setStored(STORAGE_KEYS.REVIEWS, reviews);

    // Update reviewee rating & review count
    const targetReviews = reviews.filter((r) => r.revieweeId === reviewData.revieweeId);
    const avgRating = Number(
      (targetReviews.reduce((acc, curr) => acc + curr.rating, 0) / targetReviews.length).toFixed(1)
    );

    const user = await this.getUserById(reviewData.revieweeId);
    if (user) {
      await this.updateProfile({
        id: user.id,
        rating: avgRating,
        reviewCount: targetReviews.length,
      });

      // Bonus points for 5-star review
      if (reviewData.rating === 5) {
        await this.addPoints(reviewData.revieweeId, 25, 'Received a 5-star review! ⭐');
        if (targetReviews.filter((r) => r.rating === 5).length >= 3) {
          await this.checkAndAwardBadge(reviewData.revieweeId, 'b-helpful-teacher');
        }
      }
    }

    // Award reviewer +20 points for helpful review feedback
    await this.addPoints(reviewData.reviewerId, 20, 'Gave helpful session review');

    notifyListeners('reviews', newReview);
    return newReview;
  }

  // -------------------------------------------------------------
  // GAMIFICATION & BADGES
  // -------------------------------------------------------------
  static async addPoints(userId: string, points: number, reason: string): Promise<number> {
    const transactions = getStored<PointsTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const newTx: PointsTransaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      userId,
      points,
      reason,
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(newTx);
    setStored(STORAGE_KEYS.TRANSACTIONS, transactions);

    const user = await this.getUserById(userId);
    if (user) {
      const newPoints = (user.points || 0) + points;
      await this.updateProfile({ id: user.id, points: newPoints });

      if (newPoints >= 500 && user.rating >= 4.8) {
        await this.checkAndAwardBadge(userId, 'b-skill-master');
      }

      notifyListeners(`points-${userId}`, newPoints);
      return newPoints;
    }
    return 0;
  }

  static async getPointsTransactions(userId: string): Promise<PointsTransaction[]> {
    const transactions = getStored<PointsTransaction[]>(STORAGE_KEYS.TRANSACTIONS, [
      { id: 'tx-1', userId, points: 50, reason: 'Completed profile setup', createdAt: '2026-09-20T10:00:00Z' },
      { id: 'tx-2', userId, points: 100, reason: 'Completed first skill swap session', createdAt: '2026-09-28T18:00:00Z' },
      { id: 'tx-3', userId, points: 50, reason: 'Completed teaching session: Python', createdAt: '2026-09-28T18:00:00Z' },
      { id: 'tx-4', userId, points: 25, reason: 'Received 5-star review from Priya', createdAt: '2026-09-29T10:15:00Z' },
    ]);
    return transactions.filter((t) => t.userId === userId);
  }

  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    const allUserBadges = getStored<UserBadge[]>(STORAGE_KEYS.BADGES, [
      { id: 'ub-1', userId: 'user-alex', badgeId: 'b-first-swap', badge: MASTER_BADGES[0], earnedAt: '2026-09-28T18:00:00Z' },
      { id: 'ub-2', userId: 'user-alex', badgeId: 'b-profile-pro', badge: MASTER_BADGES[5], earnedAt: '2026-08-10T10:00:00Z' },
      { id: 'ub-3', userId: 'user-priya', badgeId: 'b-helpful-teacher', badge: MASTER_BADGES[1], earnedAt: '2026-09-01T10:00:00Z' },
      { id: 'ub-4', userId: 'user-priya', badgeId: 'b-first-swap', badge: MASTER_BADGES[0], earnedAt: '2026-07-25T10:00:00Z' },
    ]);
    return allUserBadges.filter((ub) => ub.userId === userId);
  }

  static async checkAndAwardBadge(userId: string, badgeId: string): Promise<boolean> {
    const userBadges = getStored<UserBadge[]>(STORAGE_KEYS.BADGES, []);
    const alreadyEarned = userBadges.some((ub) => ub.userId === userId && ub.badgeId === badgeId);
    if (alreadyEarned) return false;

    const badge = MASTER_BADGES.find((b) => b.id === badgeId);
    if (!badge) return false;

    const newAward: UserBadge = {
      id: `ub-${Date.now()}`,
      userId,
      badgeId,
      badge,
      earnedAt: new Date().toISOString(),
    };

    userBadges.push(newAward);
    setStored(STORAGE_KEYS.BADGES, userBadges);

    await this.createNotification(
      userId,
      `Badge Unlocked: ${badge.name}! 🏆`,
      `Congratulations! You unlocked the "${badge.name}" badge and earned +${badge.pointsReward} bonus points!`,
      'badge',
      '/badges'
    );

    await this.addPoints(userId, badge.pointsReward, `Badge unlocked: ${badge.name}`);
    notifyListeners(`badge-${userId}`, newAward);
    return true;
  }

  // -------------------------------------------------------------
  // LEARNING PLANS
  // -------------------------------------------------------------
  static async getLearningPlans(userId: string): Promise<LearningPlan[]> {
    const plans = getStored<LearningPlan[]>(STORAGE_KEYS.PLANS, [
      {
        id: 'plan-1',
        userId: 'user-alex',
        skillName: 'UI/UX Design & Figma Systems',
        currentLevel: 'Beginner',
        goal: 'Design a responsive SaaS product layout in Figma with reusable components',
        hoursPerWeek: 5,
        durationWeeks: 4,
        overview: 'A 4-week structured sprint moving from wireframes and typographic grids to complete Figma token systems.',
        weeks: [
          {
            weekNumber: 1,
            title: 'Design Principles & Wireframing',
            topics: ['Visual hierarchy & spacing', 'Low-fidelity layout sketches', 'Atomic elements'],
            practiceTasks: ['Wireframe 3 screens in grayscale', 'Analyze 2 top SaaS layouts'],
            goals: 'Develop an eye for structure without getting stuck on colors.',
            estimatedHours: 5,
            sessionStructure: '30m layout critique + 30m Figma tool walkthrough',
          },
          {
            weekNumber: 2,
            title: 'Figma Auto-Layout & Variants',
            topics: ['Auto-layout constraints', 'Component variants & properties', 'Responsive frames'],
            practiceTasks: ['Build a responsive navigation bar', 'Create an interactive button set'],
            goals: 'Achieve zero manual alignment friction.',
            estimatedHours: 5,
            sessionStructure: '45m live component building with peer mentor',
          },
          {
            weekNumber: 3,
            title: 'Color Palettes & Typography Systems',
            topics: ['Color contrast accessibility (WCAG)', 'Type scales (modular scale)', 'Elevation tokens'],
            practiceTasks: ['Define primary & neutral palette', 'Build a clean card component'],
            goals: 'Harmonious, accessible UI styling.',
            estimatedHours: 5,
            sessionStructure: '20m design token review + 40m dashboard styling',
          },
          {
            weekNumber: 4,
            title: 'Full Product Prototype & Polish',
            topics: ['Interactive transitions', 'Micro-interactions', 'Peer design review feedback'],
            practiceTasks: ['Complete clickable 4-screen prototype', 'Present prototype to mentor'],
            goals: 'Deliver a finished design portfolio piece.',
            estimatedHours: 5,
            sessionStructure: '60m comprehensive design review & next steps',
          },
        ],
        createdAt: '2026-10-01T10:00:00Z',
      },
    ]);
    return plans.filter((p) => p.userId === userId);
  }

  static async saveLearningPlan(plan: Omit<LearningPlan, 'id' | 'createdAt'>): Promise<LearningPlan> {
    const plans = getStored<LearningPlan[]>(STORAGE_KEYS.PLANS, []);
    const newPlan: LearningPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    plans.unshift(newPlan);
    setStored(STORAGE_KEYS.PLANS, plans);
    notifyListeners('plans', newPlan);
    return newPlan;
  }

  static async deleteLearningPlan(planId: string): Promise<void> {
    const plans = getStored<LearningPlan[]>(STORAGE_KEYS.PLANS, []);
    const filtered = plans.filter((p) => p.id !== planId);
    setStored(STORAGE_KEYS.PLANS, filtered);
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    const notifs = getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return notifs.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: AppNotification['type'],
    link?: string
  ): Promise<AppNotification> {
    const notifs = getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      userId,
      title,
      message,
      type,
      read: false,
      link,
      createdAt: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
    notifyListeners(`notif-${userId}`, newNotif);
    return newNotif;
  }

  static async markNotificationRead(notifId: string): Promise<void> {
    const notifs = getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const index = notifs.findIndex((n) => n.id === notifId);
    if (index !== -1) {
      notifs[index].read = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
      notifyListeners('notif-update', notifs[index]);
    }
  }

  static async markAllNotificationsRead(userId: string): Promise<void> {
    const notifs = getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.userId === userId ? { ...n, read: true } : n));
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    notifyListeners('notif-update', null);
  }

  // -------------------------------------------------------------
  // CALLS (VOICE & VIDEO)
  // -------------------------------------------------------------
  static async getCalls(userId: string): Promise<CallRecord[]> {
    const calls = getStored<CallRecord[]>(STORAGE_KEYS.CALLS, INITIAL_CALLS);
    const users = await this.getUsers();

    return calls
      .filter((c) => c.callerId === userId || c.receiverId === userId)
      .map((c) => ({
        ...c,
        callerProfile: users.find((u) => u.id === c.callerId),
        receiverProfile: users.find((u) => u.id === c.receiverId),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async createCall(
    callerId: string,
    receiverId: string,
    callType: 'voice' | 'video',
    conversationId?: string
  ): Promise<CallRecord> {
    const calls = getStored<CallRecord[]>(STORAGE_KEYS.CALLS, INITIAL_CALLS);
    const users = await this.getUsers();
    const caller = users.find((u) => u.id === callerId);

    const newCall: CallRecord = {
      id: `call-${Date.now()}`,
      callerId,
      receiverId,
      conversationId,
      callType,
      status: 'calling',
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      createdAt: new Date().toISOString(),
    };

    calls.unshift(newCall);
    setStored(STORAGE_KEYS.CALLS, calls);

    // Notify receiver
    await this.createNotification(
      receiverId,
      `Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call 📞`,
      `${caller?.fullName || 'A peer'} is calling you.`,
      'call',
      '/calls'
    );

    notifyListeners('calls', newCall);
    return newCall;
  }

  static async updateCallStatus(
    callId: string,
    status: CallRecord['status'],
    durationSeconds?: number
  ): Promise<CallRecord> {
    const calls = getStored<CallRecord[]>(STORAGE_KEYS.CALLS, INITIAL_CALLS);
    const index = calls.findIndex((c) => c.id === callId);
    if (index === -1) throw new Error('Call not found');

    const call = calls[index];
    call.status = status;
    if (durationSeconds !== undefined) {
      call.durationSeconds = durationSeconds;
    }
    call.endedAt = new Date().toISOString();
    calls[index] = call;
    setStored(STORAGE_KEYS.CALLS, calls);

    notifyListeners('calls', call);
    return call;
  }

  // -------------------------------------------------------------
  // LEARNING ROOMS
  // -------------------------------------------------------------
  static async getLearningRooms(): Promise<LearningRoom[]> {
    const rooms = getStored<LearningRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const users = await this.getUsers();

    return rooms.map((r) => ({
      ...r,
      creatorProfile: users.find((u) => u.id === r.creatorId),
    }));
  }

  static async getLearningRoomById(roomId: string): Promise<LearningRoom | null> {
    const rooms = await this.getLearningRooms();
    const room = rooms.find((r) => r.id === roomId) || null;
    if (!room) return null;

    const members = await this.getRoomMembers(roomId);
    const resources = await this.getRoomResources(roomId);

    return {
      ...room,
      members,
      resources,
      currentParticipantsCount: members.length || room.currentParticipantsCount,
    };
  }

  static async createLearningRoom(
    roomData: Omit<LearningRoom, 'id' | 'createdAt' | 'currentParticipantsCount' | 'isLive'>
  ): Promise<LearningRoom> {
    const rooms = getStored<LearningRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);

    const newRoom: LearningRoom = {
      ...roomData,
      id: `room-${Date.now()}`,
      currentParticipantsCount: 1,
      isLive: roomData.status === 'live',
      createdAt: new Date().toISOString(),
    };

    rooms.unshift(newRoom);
    setStored(STORAGE_KEYS.ROOMS, rooms);

    // Add creator as host in members
    await this.joinRoom(newRoom.id, roomData.creatorId, 'host');

    // Award +40 points for hosting room
    await this.addPoints(roomData.creatorId, 40, `Created Learning Room: ${newRoom.name}`);

    notifyListeners('rooms', newRoom);
    return newRoom;
  }

  static async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const allMembers = getStored<Record<string, RoomMember[]>>(
      STORAGE_KEYS.ROOM_MEMBERS,
      INITIAL_ROOM_MEMBERS
    );
    const members = allMembers[roomId] || [];
    const users = await this.getUsers();

    return members.map((m) => ({
      ...m,
      userProfile: users.find((u) => u.id === m.userId),
    }));
  }

  static async joinRoom(
    roomId: string,
    userId: string,
    role: RoomMember['role'] = 'participant'
  ): Promise<RoomMember> {
    const allMembers = getStored<Record<string, RoomMember[]>>(
      STORAGE_KEYS.ROOM_MEMBERS,
      INITIAL_ROOM_MEMBERS
    );
    const members = allMembers[roomId] || [];

    const existingIndex = members.findIndex((m) => m.userId === userId);
    if (existingIndex !== -1) {
      return members[existingIndex];
    }

    const newMember: RoomMember = {
      id: `rm-${Date.now()}`,
      roomId,
      userId,
      role,
      isMuted: false,
      isVideoOff: false,
      handRaised: false,
      joinedAt: new Date().toISOString(),
    };

    members.push(newMember);
    allMembers[roomId] = members;
    setStored(STORAGE_KEYS.ROOM_MEMBERS, allMembers);

    // Update room count
    const rooms = getStored<LearningRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const rIdx = rooms.findIndex((r) => r.id === roomId);
    if (rIdx !== -1) {
      rooms[rIdx].currentParticipantsCount = members.length;
      setStored(STORAGE_KEYS.ROOMS, rooms);
    }

    notifyListeners(`room-${roomId}-members`, members);
    return newMember;
  }

  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    const allMembers = getStored<Record<string, RoomMember[]>>(
      STORAGE_KEYS.ROOM_MEMBERS,
      INITIAL_ROOM_MEMBERS
    );
    const members = (allMembers[roomId] || []).filter((m) => m.userId !== userId);
    allMembers[roomId] = members;
    setStored(STORAGE_KEYS.ROOM_MEMBERS, allMembers);

    notifyListeners(`room-${roomId}-members`, members);
  }

  static async updateRoomMember(
    roomId: string,
    userId: string,
    updates: Partial<RoomMember>
  ): Promise<void> {
    const allMembers = getStored<Record<string, RoomMember[]>>(
      STORAGE_KEYS.ROOM_MEMBERS,
      INITIAL_ROOM_MEMBERS
    );
    const members = allMembers[roomId] || [];
    const idx = members.findIndex((m) => m.userId === userId);
    if (idx !== -1) {
      members[idx] = { ...members[idx], ...updates };
      allMembers[roomId] = members;
      setStored(STORAGE_KEYS.ROOM_MEMBERS, allMembers);
      notifyListeners(`room-${roomId}-members`, members);
    }
  }

  static async getRoomMessages(roomId: string): Promise<RoomMessage[]> {
    const allMsgs = getStored<Record<string, RoomMessage[]>>(
      STORAGE_KEYS.ROOM_MESSAGES,
      INITIAL_ROOM_MESSAGES
    );
    return allMsgs[roomId] || [];
  }

  static async sendRoomMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    content: string,
    type: 'normal' | 'question' | 'announcement' = 'normal'
  ): Promise<RoomMessage> {
    const allMsgs = getStored<Record<string, RoomMessage[]>>(
      STORAGE_KEYS.ROOM_MESSAGES,
      INITIAL_ROOM_MESSAGES
    );
    const roomMsgs = allMsgs[roomId] || [];

    const newMsg: RoomMessage = {
      id: `rmsg-${Date.now()}`,
      roomId,
      senderId,
      senderName,
      senderAvatar,
      content,
      type,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };

    roomMsgs.push(newMsg);
    allMsgs[roomId] = roomMsgs;
    setStored(STORAGE_KEYS.ROOM_MESSAGES, allMsgs);

    notifyListeners(`room-${roomId}-messages`, newMsg);
    return newMsg;
  }

  static async pinRoomMessage(
    roomId: string,
    messageId: string,
    isPinned: boolean
  ): Promise<void> {
    const allMsgs = getStored<Record<string, RoomMessage[]>>(
      STORAGE_KEYS.ROOM_MESSAGES,
      INITIAL_ROOM_MESSAGES
    );
    const roomMsgs = allMsgs[roomId] || [];
    const idx = roomMsgs.findIndex((m) => m.id === messageId);
    if (idx !== -1) {
      roomMsgs[idx].isPinned = isPinned;
      allMsgs[roomId] = roomMsgs;
      setStored(STORAGE_KEYS.ROOM_MESSAGES, allMsgs);
      notifyListeners(`room-${roomId}-messages-update`, roomMsgs);
    }
  }

  static async getRoomResources(roomId: string): Promise<RoomResource[]> {
    const allRes = getStored<Record<string, RoomResource[]>>(
      STORAGE_KEYS.ROOM_RESOURCES,
      INITIAL_ROOM_RESOURCES
    );
    return allRes[roomId] || [];
  }

  static async addRoomResource(
    roomId: string,
    uploaderId: string,
    uploaderName: string,
    title: string,
    type: RoomResource['type'],
    url: string,
    size?: string
  ): Promise<RoomResource> {
    const allRes = getStored<Record<string, RoomResource[]>>(
      STORAGE_KEYS.ROOM_RESOURCES,
      INITIAL_ROOM_RESOURCES
    );
    const resources = allRes[roomId] || [];

    const newResource: RoomResource = {
      id: `res-${Date.now()}`,
      roomId,
      uploaderId,
      uploaderName,
      title,
      type,
      url,
      size: size || 'Link',
      createdAt: new Date().toISOString(),
    };

    resources.unshift(newResource);
    allRes[roomId] = resources;
    setStored(STORAGE_KEYS.ROOM_RESOURCES, allRes);

    notifyListeners(`room-${roomId}-resources`, newResource);
    return newResource;
  }

  static async deleteRoomResource(roomId: string, resourceId: string): Promise<void> {
    const allRes = getStored<Record<string, RoomResource[]>>(
      STORAGE_KEYS.ROOM_RESOURCES,
      INITIAL_ROOM_RESOURCES
    );
    const resources = (allRes[roomId] || []).filter((r) => r.id !== resourceId);
    allRes[roomId] = resources;
    setStored(STORAGE_KEYS.ROOM_RESOURCES, allRes);

    notifyListeners(`room-${roomId}-resources`, null);
  }
}
