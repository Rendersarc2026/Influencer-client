import { createContext } from 'react';
import {
  UserResponse,
  RoleCode,
  RequestOtpResponse,
  VerifyOtpResponse,
  UpdateProfileRequest,
} from '@contracts';

export interface AuthContextType {
  user: UserResponse | null;
  roleCode: RoleCode | null;
  profileComplete: boolean;
  termsAccepted: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOtp: (email: string) => Promise<RequestOtpResponse>;
  verifyOtp: (email: string, code: string) => Promise<VerifyOtpResponse>;
  logout: () => Promise<void>;
  acceptTerms: () => Promise<void>;
  completeProfile: (data: UpdateProfileRequest) => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
