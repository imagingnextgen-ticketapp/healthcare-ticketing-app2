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
import { SelectSiteDialogComponent } from './select-site-dialog/select-site-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

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
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
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

    this.auth.login(this.form.value)
      .pipe(
        switchMap((res: any) => {
          if (res.requiresSiteSelection) {
            this.loading = false;
            this.cdr.detectChanges();

            const dialogRef = this.dialog.open(SelectSiteDialogComponent, {
              width: window.innerWidth < 600 ? '95vw' : '420px',
              maxWidth: '95vw',
              autoFocus: false,
              disableClose: true,
              panelClass: 'fujifilm-responsive-dialog', // Changed custom class name to isolate layout rules
              data: {
                userId: res.userId,
                sites: res.sites
              }
            });

            return dialogRef.afterClosed().pipe(
              switchMap((selectedSiteId) => {
                if (!selectedSiteId) {
                  return EMPTY;
                }
                
                this.loading = true;
                this.cdr.detectChanges();

                return this.auth.selectSite({
                  userId: res.userId,
                  siteId: selectedSiteId
                });
              })
            );
          }

          return [res];
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.snackbar.open('Login Successful', 'OK', { duration: 2000 });
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tickets';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.snackbar.open(
            err.message || 'Authentication failed. Please verify credentials.',
            'Close',
            { duration: 5000 }
          );
        }
      });
  }
}
