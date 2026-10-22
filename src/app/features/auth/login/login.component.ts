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
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    if (!this.route.snapshot.queryParams['returnUrl']) {
      this.auth.logout();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.auth.login(this.form.value).subscribe({
        next: () => {
          this.loading = false;
          this.snackbar.open('Login Successful', 'OK', { duration: 2000 });
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tickets';
          this.router.navigateByUrl(returnUrl);
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
}
