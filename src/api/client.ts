const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

interface NomineeLoginResponse {
  success: boolean;
  token: string;
  redirect: string;
  nominee: {
    id: string;
    email: string;
    userId: string;
    name: string;
    beneficiaryReferenceId: string;
    status: string;
    verificationStatus: string;
  };
  message?: string;
  reason?: string;
}

// Dashboard Types
export interface OwnerInfo {
  name: string;
  email: string;
  status: 'DECEASED' | 'ACTIVE';
  continuity_triggered: boolean;
  continuity_trigger_date: string | null;
}

export interface NomineeInfo {
  id: string;
  name: string;
  email: string;
  relationship: string;
  ben_id: string;
  status: string;
  verified_at: string | null;
  access_type: string;
}

export interface DigitalAsset {
  _id: string;
  asset_name: string;
  asset_type: 'Legal' | 'Financial' | 'Personal' | 'Media' | 'Other';
  description?: string;
  status: 'LOCKED' | 'PENDING' | 'RELEASED';
  release_condition: string;
  version_count: number;
  last_modified: string;
  released_at?: string;
  file_size?: number;
  mime_type?: string;
}

export interface LegacyNote {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  release_condition: string;
  written_date: string;
  last_modified: string;
}

export interface VerificationStatus {
  death_certificate_status: 'Verified' | 'Pending' | 'Not Submitted';
  verification_method: string | null;
  verification_timestamp: string | null;
  verifying_authority: string | null;
  access_state: 'ACTIVE' | 'SUSPENDED';
}

export interface AuditLog {
  _id: string;
  action: string;
  action_details: string | null;
  ip_address: string;
  device_type: string;
  status: string;
  timestamp: string;
}

export interface SessionInfo {
  started_at: string;
  token_expires_in: number;
  ip_address: string;
  device_type: string;
}

export interface NomineeDashboardData {
  owner: OwnerInfo;
  nominee: NomineeInfo;
  assets: DigitalAsset[];
  notes: LegacyNote[];
  verification: VerificationStatus;
  auditLogs: AuditLog[];
  session: SessionInfo;
  access_granted: boolean;
}

/**
 * User API calls
 */
export const userApi = {
  register: async (userData: { email: string; fullName: string; password: string }): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  login: async (credentials: { email: string; password: string }): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  addNominee: async (token: string, nomineeData: {
    nominee_email: string;
    nominee_name: string;
    relation: string;
  }): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/add-nominee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(nomineeData)
    });
    return response.json();
  },

  getNominees: async (token: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/nominees`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  triggerContinuity: async (token: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/trigger-continuity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },
  uploadAsset: async (token: string, formData: FormData): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/upload-asset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // NOTE: Do NOT set 'Content-Type': 'multipart/form-data' manually.
        // The browser sets it automatically with the correct boundary for FormData.
      },
      body: formData
    });
    return response.json();
  }
};

/**
 * Nominee API calls
 */
export const nomineeApi = {
  validateCredentials: async (credentials: {
    nominee_email: string;
    beneficiary_reference_id: string;
  }): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/nominee/validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  login: async (credentials: {
    nominee_email: string;
    beneficiary_reference_id: string;
  }): Promise<NomineeLoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/nominee/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  uploadDeathProof: async (data: {
    nominee_email: string;
    beneficiary_reference_id: string;
    document_name: string;
    file_path: string;
  }): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/nominee/upload-death-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  getDashboard: async (token: string): Promise<ApiResponse<NomineeDashboardData>> => {
    const response = await fetch(`${API_BASE_URL}/nominee/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  logAction: async (token: string, actionData: {
    action: 'VIEWED_ASSET' | 'DOWNLOADED_ASSET' | 'VIEWED_NOTE' | 'DOWNLOADED_NOTE' | 'SESSION_END';
    asset_id?: string;
    note_id?: string;
    details?: string;
  }): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/nominee/log-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(actionData)
    });
    return response.json();
  }
};

/**
 * Health check
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};
