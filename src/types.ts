export type UserRole = 'admin' | 'solver' | 'presenter' | 'viewer';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string;
  canShareScreen?: boolean;
  canGenerateText?: boolean;
  notes?: string;
}

export interface ScreenSession {
  sessionId: string;
  hostUid: string;
  hostEmail: string;
  hostName: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  viewerCount?: number;
  currentResolution?: string;
}

export interface OptionAnalysis {
  option: string;
  text: string;
  status: 'Correct' | 'Incorrect' | 'Likely';
  reason: string;
}

export interface GeneratedScreenData {
  extractedText: string;
  detectedQuestion?: string;
  questionType?: string;
  recommendedAnswer?: string;
  explanation?: string;
  confidence?: number;
  optionsAnalysis?: OptionAnalysis[];
}

export interface ScreenCaptureRecord {
  id: string;
  sessionId: string;
  authorUid: string;
  authorEmail: string;
  thumbnailBase64?: string;
  data: GeneratedScreenData;
  createdAt: string;
}

export interface ViewerDisplaySettings {
  isMaximized: boolean;
  isFullscreen: boolean;
  zoomLevel: number; // 1, 1.25, 1.5, 2
  filterMode: 'normal' | 'high_contrast' | 'invert' | 'sharp_monochrome';
  isPiP: boolean;
}
