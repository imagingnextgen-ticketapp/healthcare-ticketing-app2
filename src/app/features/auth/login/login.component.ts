import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OtpVerification } from '../otp-verification/otp-verification';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    RouterModule,
    MatProgressSpinnerModule,
    OtpVerification,
  ]
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  otpForm!: FormGroup;

  loading = false;
  otpStep = false;
  challengeId = '';
  maskedEmail = '';
  resendLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private snackbar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.otpForm = this.fb.group({
      otp: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{6}$/)
      ]]
    });

    if (!this.route.snapshot.queryParams['returnUrl']) {
      this.auth.logout();
    }

    const resetToken = this.route.snapshot.queryParamMap.get('token');
    const resetEmail = this.route.snapshot.queryParamMap.get('email');

    if (resetToken && resetEmail) {
      this.router.navigate(['/reset-password'], {
        queryParams: {
          token: resetToken,
          email: resetEmail,
          forced: this.route.snapshot.queryParamMap.get('forced') === 'true'
        },
        replaceUrl: true
      });
    }
  }

  // Step 1: Login using username and password
  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.auth.login(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;

        // MFA required: show OTP form instead of navigating
        if (res?.requiresMfa) {
          this.challengeId = res.challengeId;
          this.maskedEmail = res.emailMasked || '';
          this.otpStep = true;

          this.snackbar.open(
            res.message || 'OTP sent to your registered email address.',
            'OK',
            { duration: 3000 }
          );

          this.cdr.detectChanges();
          return;
        }

        // Existing login response containing token
        if (res?.token) {
          this.snackbar.open('Login Successful', 'OK', { duration: 2000 });
          this.navigateAfterLogin();
          return;
        }

        this.snackbar.open(
          res?.message || 'Unable to complete login.',
          'Close',
          { duration: 4000 }
        );

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();

        this.snackbar.open(
          err.message || 'Authentication failed. Please verify credentials.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  // Step 2: Verify the email OTP
  verifyOtp(): void {
    if (this.otpForm.invalid || this.loading || !this.challengeId) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.auth.verifyOtp({
      challengeId: this.challengeId,
      otp: this.otpForm.value.otp
    }).subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.success && res?.loginResponse?.token) {
          this.snackbar.open('Login Successful', 'OK', { duration: 2000 });
          this.navigateAfterLogin();
          return;
        }

        this.snackbar.open(
          res?.message || 'Invalid or expired OTP.',
          'Close',
          { duration: 4000 }
        );

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();

        this.snackbar.open(
          err.message || 'OTP verification failed.',
          'Close',
          { duration: 4000 }
        );
      }
    });
  }

  onOtpVerified(): void {
    this.snackbar.open('Login Successful', 'OK', { duration: 2000 });
    this.navigateAfterLogin();
  }

  backToLogin(): void {
    this.otpStep = false;
    this.challengeId = '';
    this.otpForm.reset();
    this.cdr.detectChanges();
  }

  onForcedReset(reset: {
    token: string;
    email: string;
    maskedEmail?: string;
  }): void {
    this.router.navigate(['/reset-password'], {
      queryParams: {
        token: reset.token,
        email: reset.email,
        maskedEmail: reset.maskedEmail || reset.email,
        forced: true
      }
    });
  }

  // Resend OTP
  resendOtp(): void {
    if (!this.challengeId || this.resendLoading) {
      return;
    }

    this.resendLoading = true;
    this.cdr.detectChanges();

    this.auth.resendMfaOtp({
      challengeId: this.challengeId
    }).subscribe({
      next: (res) => {
        this.resendLoading = false;

        // Update challengeId because backend creates a new OTP challenge
        if (res?.challengeId) {
          this.challengeId = res.challengeId;
          this.otpForm.reset();
        }

        this.snackbar.open(
          res?.message || 'A new OTP has been sent.',
          'OK',
          { duration: 3000 }
        );

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resendLoading = false;
        this.cdr.detectChanges();

        this.snackbar.open(
          err.message || 'Unable to resend OTP.',
          'Close',
          { duration: 4000 }
        );
      }
    });
  }

  // Navigate only after successful authentication
  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tickets';
    this.router.navigateByUrl(returnUrl);
    this.cdr.detectChanges();
  }
}