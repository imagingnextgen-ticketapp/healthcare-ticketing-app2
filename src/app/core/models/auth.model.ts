export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  email: string;
  newPassword?: string;     // Matches C# [Required]
  confirmPassword?: string; // Matches C# [Compare]
}


export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  email: string;
  newPassword?: string;
  confirmPassword?: string;
}

// MFA: Login response
export interface LoginResponseDto {
  requiresMfa: boolean;
  challengeId?: string;
  message?: string;
  token?: string;
}

// MFA: Verify OTP request
export interface VerifyOtpDto {
  challengeId: string;
  otp: string;
}

// MFA: Verify OTP response
export interface VerifyOtpResponseDto {
  success: boolean;
  message?: string;
  loginResponse?: {
    token: string;
    user?: any;
  };
}

// MFA: Resend OTP request
export interface ResendOtpDto {
  challengeId: string;
}

// MFA: Resend OTP response
export interface ResendOtpResponseDto {
  challengeId?: string;
  message?: string;
}