export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  email: string;
  newPassword?: string;     // Matches C# [Required]
  confirmPassword?: string; // Matches C# [Compare]
}
