import { Component, OnInit, ChangeDetectorRef,ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DashboardDto } from '../../core/models/mis-report.model';
import { MisServiceReport } from '../../core/services/mis-report.service';
import { AuthService } from '../../core/services/auth.service';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MaterialModules],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  stats: DashboardDto = {
    totalTickets: 0,
    openedTickets: 0,
    closedTickets: 0,
    escalatedTickets: 0
  };

  currentUser: any;

  readonly ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    SUPPORT_ENGINEER: 'SupportEngineer',
    HOSPITAL_ADMIN: 'HospitalAdmin',
    HOSPITAL_USER: 'HospitalUser'
  };

  constructor(
    private misService: MisServiceReport,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.currentUser = this.auth.getUser();

    this.misService.getDashboard().subscribe({
      next: (res) => {
        this.stats = res;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Dashboard Error:', err);
      }
    });
  }
}