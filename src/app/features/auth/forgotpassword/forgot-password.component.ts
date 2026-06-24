import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = false;
  message = '';
  isError = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      this.message = '';
      this.isError = false;
      
      const dto = { email: this.forgotForm.value.email };

      this.authService.forgotPassword(dto).subscribe({
        next: (res) => {
          this.isError = false;
          this.message = res.message || 'If an account exists, a reset link has been sent.';
          this.isLoading = false;
          this.forgotForm.reset(); // 🟢 Resets the form on success
        },
        error: (err) => {
          this.isError = true;
          this.message = err.message || 'Something went wrong. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }
}
