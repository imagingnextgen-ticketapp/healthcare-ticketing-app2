import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import {
  DashboardDto,
  DashboardFilterDto
} from '../../core/models/mis-report.model';

import { MisServiceReport } from '../../core/services/mis-report.service';
import { AuthService } from '../../core/services/auth.service';
import { MaterialModules } from '../../shared/material.collection';

type DashboardCard =
  | 'total'
  | 'opened'
  | 'closed'
  | 'escalated';

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MaterialModules
  ],

  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  // =========================================================
  // DASHBOARD STATS
  // =========================================================

  stats: DashboardDto = {
    totalTickets: 0,
    openedTickets: 0,
    closedTickets: 0,
    escalatedTickets: 0
  };


  // =========================================================
  // DATE FILTER
  // =========================================================

  fromDate: Date | null = null;

  toDate: Date | null = null;

  /**
   * True after dashboard data has been successfully loaded.
   */
  filterApplied = false;

  /**
   * Prevents concurrent API execution when clicking rapidly.
   */
  isLoading = false;


  // =========================================================
  // CURRENT USER
  // =========================================================

  currentUser: any;

  readonly ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    SUPPORT_ENGINEER: 'SupportEngineer',
    HOSPITAL_ADMIN: 'HospitalAdmin',
    HOSPITAL_USER: 'HospitalUser'
  };


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private misService: MisServiceReport,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.currentUser = this.auth.getUser();

    // Retain and rebuild date states if navigating back from a running MIS tab session
    const currentRouteParams = this.router.parseUrl(this.router.url).queryParams;
    if (currentRouteParams['fromDate']) {
      this.fromDate = new Date(currentRouteParams['fromDate']);
    }
    if (currentRouteParams['toDate']) {
      this.toDate = new Date(currentRouteParams['toDate']);
    }

    this.loadDashboard();
  }



  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  // =========================================================
  // LOAD DASHBOARD (Optimized with smooth visual transition)
  // =========================================================
  loadDashboard(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const startTime = Date.now();
    const filter: DashboardFilterDto = {
      fromDate: this.fromDate ? this.formatDate(this.fromDate) : undefined,
      toDate: this.toDate ? this.formatDate(this.toDate) : undefined
    };

    this.misService.getDashboard(filter).subscribe({
      next: (response: DashboardDto) => {
        // Calculate how fast the database responded
        const elapsedTime = Date.now() - startTime;
        const minimumVisualDelay = 400; // 400ms is the sweet spot for smooth UI animations
        const remainingDelay = Math.max(0, minimumVisualDelay - elapsedTime);

        // Wait out the remaining milliseconds before updating the UI state
        setTimeout(() => {
          this.stats = response;
          this.filterApplied = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        }, remainingDelay);
      },
      error: (error) => {
        console.error('Dashboard Error:', error);
        this.filterApplied = false;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }


  // =========================================================
  // APPLY DATE FILTER
  // =========================================================

  applyDateFilter(): void {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      console.error('From Date cannot be greater than To Date');
      return;
    }
    this.loadDashboard();
  }


  // =========================================================
  // CLEAR DATE FILTER
  // =========================================================

  clearDateFilter(): void {
    this.fromDate = null;
    this.toDate = null;
    this.loadDashboard();
  }


  // =========================================================
  // DASHBOARD CARD → MIS REPORT
  // =========================================================

    // =========================================================
  // DASHBOARD CARD → MIS REPORT (OPEN IN NEW WINDOW)
  // =========================================================
  openMisReport(card: DashboardCard): void {
    if (!this.filterApplied) {
      return;
    }

    const queryParams: {
      fromDate?: string;
      toDate?: string;
      status?: string;
      escalated?: string;
      dashboardFilter?: string;
    } = {};

    // 1. Retain Date Ranges Across Tab Boundary
    if (this.fromDate) {
      queryParams.fromDate = this.formatDate(this.fromDate);
    }

    if (this.toDate) {
      queryParams.toDate = this.formatDate(this.toDate);
    }

    // 2. Card Specific Parameters Mapping
    switch (card) {
      case 'total':
        break;

      case 'opened':
        queryParams.dashboardFilter = 'opened';
        break;

      case 'closed':
        queryParams.status = 'Closed';
        break;

      case 'escalated':
        queryParams.escalated = 'true';
        break;
    }

    // 3. Serialize and launch in a new browser window
    const urlTree = this.router.createUrlTree(['/mis-report'], { queryParams });
    const serializedUrl = this.router.serializeUrl(urlTree);

    // Open target window securely
    // 🟢 The secure multi-window handler configuration pattern
   window.open(serializedUrl, '_blank', 'noopener,noreferrer');

  }


  // =========================================================
  // DATE FORMAT
  // =========================================================

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
