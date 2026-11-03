import {Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { finalize } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './otp-verification.html',
  styleUrls: ['./otp-verification.scss']
})
export class OtpVerification implements OnInit, OnDestroy {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  @Input({ required: true }) challengeId!: string;
  @Input() maskedEmail = '';

  @Output() verified = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() challengeIdChange = new EventEmitter<string>();
  @Output() forcedReset = new EventEmitter<{
    token: string;
    email: string;
    maskedEmail?: string;
  }>();

  readonly isLoading = signal(false);
  readonly isResending = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly resendCountdown = signal(60);

  private resendTimer: ReturnType<typeof setInterval> | null = null;

  readonly otpForm = this.fb.nonNullable.group({
    otp: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{6}$/)
      ]
    ]
  });

  ngOnInit(): void {
    this.startResendCountdown(60);
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  onOtpInput(): void {
    const currentValue = this.otpForm.controls.otp.value;
    const cleanedValue = currentValue.replace(/\D/g, '').slice(0, 6);

    if (currentValue !== cleanedValue) {
      this.otpForm.controls.otp.setValue(cleanedValue);
    }

    this.errorMessage.set('');
  }

  verifyOtp(): void {
    if (
      this.otpForm.invalid ||
      this.isLoading() ||
      this.isResending()
    ) {
      this.otpForm.markAllAsTouched();
      return;
    }

    if (!this.challengeId) {
      this.errorMessage.set(
        'Your verification session is invalid. Please sign in again.'
      );
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    this.authService.verifyOtp({
      challengeId: this.challengeId,
      otp: this.otpForm.controls.otp.value
    })
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.loginResponse?.token) {
            this.clearResendTimer();
            this.verified.emit();
            return;
          }

          if (response.forcedResetRequired && response.resetToken) {
            this.clearResendTimer();
            this.forcedReset.emit({
              token: response.resetToken,
              email: response.email || '',
              maskedEmail: response.emailMasked
            });
            return;
          }

          this.errorMessage.set(
            response.message || 'Invalid OTP. Please try again.'
          );
        },

        error: (error) => {
          this.errorMessage.set(
            error?.message ||
            'OTP verification failed. Please try again.'
          );
        }
      });
  }

  resendOtp(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (
      !this.challengeId ||
      this.isResending() ||
      this.isLoading() ||
      this.resendCountdown() > 0
    ) {
      return;
    }

    this.isResending.set(true);

    this.authService.resendMfaOtp({
      challengeId: this.challengeId
    })
      .pipe(
        finalize(() => this.isResending.set(false))
      )
      .subscribe({
        next: (response) => {
          if (!response.challengeId) {
            this.errorMessage.set(
              response.message || 'Unable to resend OTP. Please try again.'
            );
            return;
          }

          // Backend generates a new challenge ID for the new OTP
          this.challengeId = response.challengeId;
          this.challengeIdChange.emit(response.challengeId);

          this.otpForm.reset({ otp: '' });

          this.successMessage.set(
            response.message || 'A new OTP has been sent to your email.'
          );

          this.startResendCountdown(60);
        },

        error: (error) => {
          this.errorMessage.set(
            error?.message ||
            'Unable to resend OTP. Please try again later.'
          );

          if (error?.status === 429) {
            this.startResendCountdown(60);
          }
        }
      });
  }

  goBack(): void {
    if (this.isLoading() || this.isResending()) {
      return;
    }

    this.clearResendTimer();
    this.back.emit();
  }

  private startResendCountdown(seconds: number): void {
    this.clearResendTimer();
    this.resendCountdown.set(seconds);

    this.resendTimer = setInterval(() => {
      const remaining = this.resendCountdown();

      if (remaining <= 1) {
        this.resendCountdown.set(0);
        this.clearResendTimer();
        return;
      }

      this.resendCountdown.set(remaining - 1);
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer !== null) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}