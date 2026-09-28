export type ForgotPasswordStep = 'request' | 'verify' | 'reset' | 'success';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasNumberOrSpecial: boolean;
  passwordsMatch: boolean;
}

export interface PasswordRecoveryState {
  email: string;
  otpCode: string[];
  generatedOtp: string;
  newPassword: string;
  confirmPassword: string;
  step: ForgotPasswordStep;
  resendTimer: number;
}
