import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms'; // 🟢 Added FormControl
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
  // 🟢 FIX 1: Strongly type your form group properties explicitly
  resetForm: FormGroup<{
    newPassword: FormControl<string | null>;
    confirmPassword: FormControl<string | null>;
  }>;
  
  token: string | null = null;
  email: string | null = null;
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
    // 🟢 FIX 2: Modern syntax that removes the deprecation warning
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

    if (!this.token || !this.email) {
      this.errorMessage = 'Invalid, expired, or missing reset information parameters.';
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.resetForm.valid && this.token && this.email) {
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
          this.successMessage = 'Success! Your password has been updated. You can now log in using your Username/Email and your new password.';
          
          this.cdr.detectChanges(); // Unfreezes the UI state
          
          setTimeout(() => this.router.navigate(['/login']), 4000);
        },
        error: (err) => {
          this.errorMessage = err.message || 'Reset operations failed on server.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }
}
