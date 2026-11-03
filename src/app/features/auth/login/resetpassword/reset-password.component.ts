import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  resetForm: FormGroup<{
    newPassword: FormControl<string | null>;
    confirmPassword: FormControl<string | null>;
  }>;

  token: string | null = null;
  email: string | null = null;
  maskedEmail: string | null = null;

  // Identifies whether this is a forced reset after failed OTP attempts
  isForcedReset: boolean = false;

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.resetForm = this.fb.group({
      newPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)]
      }),
      confirmPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.email = this.route.snapshot.queryParamMap.get('email');
    this.maskedEmail = this.route.snapshot.queryParamMap.get('maskedEmail');

    // Read forced=true from the reset link
    this.isForcedReset =
      this.route.snapshot.queryParamMap.get('forced') === 'true';

    if (!this.token || !this.email) {
      this.errorMessage = 'Invalid, expired, or missing reset information parameters.';
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    if (!this.token || !this.email) {
      this.errorMessage = 'Invalid or expired password reset link.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const model = {
      token: this.token,
      email: this.email,
      newPassword: this.resetForm.value.newPassword || '',
      confirmPassword: this.resetForm.value.confirmPassword || ''
    };

    this.authService.resetPassword(model).subscribe({
      next: (res) => {
        this.isLoading = false;

        this.successMessage = this.isForcedReset
          ? 'Your password has been reset successfully. Please log in again.'
          : 'Success! Your password has been updated. You can now log in using your Username/Email and your new password.';

        this.cdr.detectChanges();

        setTimeout(() => this.router.navigate(['/login']), 4000);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Password reset failed on server.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}