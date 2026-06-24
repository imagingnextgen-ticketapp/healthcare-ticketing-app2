import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { MaterialModules } from '../../shared/material.collection';
import { TicketCreateComponent } from '../../features/tickets/ticket-create.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MaterialModules,
    MatDialogModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  user: any = null;
  isSidenavOpen = true;
  isMobile = false;

  notifications: any[] = [];
  unreadCount = 0;

  private destroyed$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(result => {
        this.isMobile = result.matches;
        this.isSidenavOpen = !this.isMobile;
        this.cdr.detectChanges();
      });

    this.loadUserData();
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  /**
   * Helper to get cleaned role for template logic
   */
  get userRole(): string {
    return (this.user?.role || '').toLowerCase();
  }

  loadUserData(): void {
    this.user = this.auth.getUser();
    if (!this.user) {
      console.warn('MainLayout: No user data found.');
    }
    this.cdr.detectChanges();
  }

  // 🔔 Notification Methods
  loadNotifications(): void {
    this.notificationService.getMyNotifications().subscribe({
      next: (res: any) => {
        this.notifications = res || [];
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Notification error:', err)
    });
  }

  markAsRead(n: any): void {
    if (!n.isRead) {
      this.notificationService.markAsRead(n.notificationId).subscribe(() => {
        this.loadNotifications();
      });
    }
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe(() => {
      this.loadNotifications();
    });
  }

  openCreateTicketDialog(): void {
    const dialogRef = this.dialog.open(TicketCreateComponent, {
      width: '750px',
      disableClose: true,
      panelClass: 'fuji-modern-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Logic to refresh current view if needed
      }
    });
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
    this.cdr.detectChanges();
  }

  closeSidenavOnMobile(): void {
    if (this.isMobile) {
      this.isSidenavOpen = false;
      this.cdr.detectChanges();
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
