import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';

import { UserService } from '../../core/services/user.service';
import { UserFilter, UserSiteDetailDto } from '../../core/models/user.model';
import { UserCreateComponent } from './user-create.component';
import { MaterialModules } from '../../shared/material.collection';
import { ResetPasswordDialogComponent } from '../admin/user-management-password/reset-password-dialog.component';
import { UserSitesDialogComponent } from './user-site-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MaterialModules], 
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  dataSource: any[] = [];
  displayedColumns: string[] = [
    'fullName',
    'userName', 
    'phoneNumber', 
    'email', 
    'roleName', 
    'masterSiteName', 
    'status', 
    'createdDate', 
    'actions'
  ];
  
  totalRecords = 0;
  pageSize = 10;
  pageNumber = 1;
  search = '';

  private searchSubject = new Subject<string>();

  constructor(
    private userService: UserService, 
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef 
  ) {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(val => {
      this.search = val;
      this.pageNumber = 1; 
      this.loadUsers();
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const filter: UserFilter = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.search,
    };

    this.userService.getUsers(filter).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.dataSource = res.data || [];
          this.totalRecords = res.totalRecords || 0;
          this.cdr.detectChanges(); 
        });
      },
      error: () => this.snackBar.open('Error loading users', 'Close', { duration: 3000 })
    });
  }

  // =========================================================================
  // ⚡ UPDATED: REFRESHES CODES ON STATUS TOGGLE FOR FLUID DATA SYNC
  // Handles your "At One Go" deactivation/activation rule across client tables
  // =========================================================================
  toggleUserStatus(user: any): void {
    const operation = user.isActive 
      ? this.userService.deactivateUser(user.userId) 
      : this.userService.activateUser(user.userId);

    operation.subscribe({
      next: (message: string) => {
        this.snackBar.open(message || 'User status updated successfully', 'OK', { duration: 3000 });
        
        // ⚡ DATA SYNC REFRESH: Full reload ensures that when a user is toggled,
        // their hospital name column instantly updates to reflect database state.
        this.loadUsers();
      },
      error: (err) => this.snackBar.open(err.error || 'Operation failed', 'Close')
    });
  }

  viewUserSites(user: any): void {
    this.userService.getUserSites(user.userId).subscribe({
      next: (sites: UserSiteDetailDto[]) => {
        if (sites && sites.length > 0) {
          this.dialog.open(UserSitesDialogComponent, {
            width: '700px',
            data: {
              userName: user.userName,
              sites: sites
            }
          });
        } else {
          this.snackBar.open(`No active sites are currently assigned to ${user.userName}.`, 'Close', {
            duration: 4000,
            panelClass: ['info-snackbar'] 
          });
        }
      },
      error: (err) => {
        this.snackBar.open('Unable to load sites at this time.', 'Close', { duration: 3000 });
      }
    });
  }

  openResetPasswordDialog(user: any): void {
    const dialogRef = this.dialog.open(ResetPasswordDialogComponent, {
      width: '400px',
      data: { username: user.userName }
    });

    dialogRef.afterClosed().subscribe(newPassword => {
      if (newPassword) {
        this.userService.adminResetPassword(user.userId, newPassword).subscribe({
          next: (res) => this.snackBar.open(res.message || 'Password reset successful', 'OK', { duration: 3000 }),
          error: (err) => this.snackBar.open(err.error?.message || 'Reset failed', 'Close')
        });
      }
    });
  }

  openUserDialog(user?: any): void {
    const dialogRef = this.dialog.open(UserCreateComponent, {
      width: '520px',
      data: user 
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }
}
