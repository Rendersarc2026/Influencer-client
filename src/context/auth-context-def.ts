import { createContext } from 'react';
import {
  UserResponse,
  RoleCode,
  RequestOtpResponse,
  CurrentUserResponse,
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
  verifyOtp: (email: string, code: string) => Promise<CurrentUserResponse>;
  logout: () => Promise<void>;
  acceptTerms: () => Promise<CurrentUserResponse>;
  completeProfile: (data: UpdateProfileRequest) => Promise<CurrentUserResponse>;
  refetchUser: () => Promise<CurrentUserResponse | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
