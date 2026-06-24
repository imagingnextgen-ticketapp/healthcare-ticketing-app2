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

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,           // Crucial for *ngIf
    ReactiveFormsModule,    // Crucial for [formGroup]
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule, 
    MatSnackBarModule,
    RouterModule,
    MatProgressSpinnerModule
  ]
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private snackbar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    // Initialize form
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Logout only if not returning from redirect
    if (!this.route.snapshot.queryParams['returnUrl']) {
      this.auth.logout();
    }
  }

    submit(): void {
    if (this.form.invalid) return;

    this.loading = true;

    // Passing the form value object to match your C# LoginDto
    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.snackbar.open('Login Successful', 'OK', { duration: 2000 });
        
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tickets';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;

        // Validation: err.message pulls your C# Exception string
        // e.g., "Your account is deactivated."
        this.snackbar.open(err.message || 'Invalid username or password', 'Close', {
          duration: 5000
        });

        this.cdr.detectChanges();
      }
    });
  }

}