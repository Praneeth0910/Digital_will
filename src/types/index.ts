export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  continuityTriggered?: boolean;
  dateOfDeathVerifiedAt?: string;
}

export interface Nominee {
  id: string;
  email: string;
  ownerId: string;
  ownerReferenceId: string;
  name?: string;
  relationship?: string;
  accessPhrase: string;
  status: 'INACTIVE' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED';
  deathDocumentUrl?: string;
  deathDocumentName?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface DigitalAsset {
  id: string;
  ownerId: string;
  title: string;
  type: 'document' | 'password' | 'media' | 'crypto' | 'other';
  description: string;
  isReleased: boolean;
}

export interface DeadManSwitch {
  ownerId: string;
  checkInFrequencyDays: number;
  lastCheckIn: string;
  nextCheckInDue: string;
  isTriggered: boolean;
  triggeredAt?: string;
}

export interface FileVersion {
  versionNumber: number;
  uploadedAt: string;
  fileSize: string;
  fileName: string;
  file: File;
}

export interface VaultFile {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: 'Legal' | 'Financial' | 'Personal' | 'Credentials' | 'Other';
  status: 'Active' | 'Archived';
  versions: FileVersion[];
  createdAt: string;
  lastUpdated: string;
}
