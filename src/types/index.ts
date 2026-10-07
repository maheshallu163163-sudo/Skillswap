export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type LearningMode = 'online' | 'in-person' | 'both';
export type SkillType = 'teach' | 'learn';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  name: string;
  category: string;
  type: SkillType;
  experienceLevel: ExperienceLevel;
  description?: string;
  isPrimary?: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  city: string;
  country?: string;
  bio: string;
  experience: string; // e.g. "5+ years in Software & Design"
  languages: string[];
  learningMode: LearningMode;
  availability: string[]; // e.g. ["Weekday mornings", "Weekends"]
  learningGoals: string;
  points: number;
  rating: number; // e.g. 4.9
  reviewCount: number;
  completedSwapsCount: number;
  createdAt: string;
  updatedAt: string;
  skills?: UserSkill[];
}

export interface SkillCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
}

export interface MasterSkill {
  id: string;
  name: string;
  category: string;
  popular?: boolean;
}

export interface SwapRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderProfile?: UserProfile;
  receiverProfile?: UserProfile;
  teachSkillId: string;
  teachSkillName: string;
  learnSkillId: string;
  learnSkillName: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  readAt?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  otherUser?: UserProfile;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
}

export interface Session {
  id: string;
  swapRequestId: string;
  teacherId: string;
  learnerId: string;
  teacherProfile?: UserProfile;
  learnerProfile?: UserProfile;
  skillId: string;
  skillName: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
  meetingMode: LearningMode;
  meetingLink?: string;
  locationDetails?: string;
  notes?: string;
  status: SessionStatus;
  completedByTeacher?: boolean;
  completedByLearner?: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number; // 1-5
  comment: string;
  tags: string[]; // e.g. ["Helpful", "Patient", "Great Teacher", "Punctual"]
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  category: 'swaps' | 'reputation' | 'community' | 'learning';
  pointsReward: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface LearningPlanWeek {
  weekNumber: number;
  title: string;
  topics: string[];
  practiceTasks: string[];
  goals: string;
  estimatedHours: number;
  sessionStructure: string;
}

export interface LearningPlan {
  id: string;
  userId: string;
  skillName: string;
  currentLevel: ExperienceLevel;
  goal: string;
  hoursPerWeek: number;
  durationWeeks: number;
  overview: string;
  weeks: LearningPlanWeek[];
  createdAt: string;
}

export interface MatchScoreResult {
  userId: string;
  user: UserProfile;
  score: number; // 0 to 100
  reasons: string[];
  complementaryTeach: string[]; // skills they teach that you want
  complementaryLearn: string[]; // skills they want that you teach
  learningModeMatch: boolean;
  availabilityMatch: boolean;
  languageMatch: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request' | 'message' | 'session' | 'badge' | 'review' | 'call' | 'room';
  read: boolean;
  link?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Voice & Video Call Models
// -------------------------------------------------------------
export type CallType = 'voice' | 'video';
export type CallStatus = 'calling' | 'connecting' | 'connected' | 'completed' | 'missed' | 'declined' | 'failed';

export interface CallRecord {
  id: string;
  callerId: string;
  receiverId: string;
  callerProfile?: UserProfile;
  receiverProfile?: UserProfile;
  conversationId?: string;
  callType: CallType;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  createdAt: string;
}

// -------------------------------------------------------------
// Learning Room Models
// -------------------------------------------------------------
export type RoomType = 'public' | 'private';
export type RoomStatus = 'live' | 'scheduled' | 'ended';
export type RoomRole = 'host' | 'co-host' | 'participant';
export type RoomLearningMode = 'video' | 'voice' | 'chat' | 'hybrid';
export type RoomMessageType = 'normal' | 'question' | 'announcement';

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  userProfile?: UserProfile;
  role: RoomRole;
  isMuted?: boolean;
  isVideoOff?: boolean;
  handRaised?: boolean;
  joinedAt: string;
}

export interface RoomResource {
  id: string;
  roomId: string;
  uploaderId: string;
  uploaderName?: string;
  title: string;
  type: 'pdf' | 'link' | 'note' | 'video' | 'doc';
  url: string;
  size?: string;
  createdAt: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: RoomMessageType;
  isPinned?: boolean;
  createdAt: string;
}

export interface LearningRoom {
  id: string;
  creatorId: string;
  creatorProfile?: UserProfile;
  name: string;
  description: string;
  skillName: string;
  skillLevel: ExperienceLevel;
  maxParticipants: number;
  currentParticipantsCount: number;
  learningMode: RoomLearningMode;
  roomType: RoomType;
  status: RoomStatus;
  scheduledAt?: string;
  isLive: boolean;
  members?: RoomMember[];
  resources?: RoomResource[];
  createdAt: string;
}

// -------------------------------------------------------------
// AI Session Assistant Result
// -------------------------------------------------------------
export interface SessionSummaryResult {
  summary: string;
  keyTakeaways: string[];
  practiceQuestions: string[];
  homework: string[];
  nextTopics: string[];
}
