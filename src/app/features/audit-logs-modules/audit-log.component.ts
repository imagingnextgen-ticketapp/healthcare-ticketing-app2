import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ACTION_TYPES, SYSTEM_MODULES } from '../../core/models/audit-ui.constants';
// 🟢 CHANGED: Import the newly constructed DTO layout
import { AuditLogResponseDto } from '../../core/models/auditlog.model';
import { PagedResponse } from '../../core/models/generic-response.model'; 
import { AuditlogService } from '../../core/services/auditlog.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../shared/material.collection';
import { MasterSiteService } from '../../core/services/mastersite.service';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MaterialModules],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss']
})
export class AuditListComponent implements OnInit {
  modules = SYSTEM_MODULES;
  actions = ACTION_TYPES;
  users: any[] = [];
  hospitals: any[] = []; 
  // 🟢 CHANGED: Update container type array to receive the clean DTO elements
  logs: AuditLogResponseDto[] = [];
  totalRecords = 0;
  loading = false;
  isHospitalAdmin = false;
  isSuperAdmin = false;

  pageSizeOptions: number[] = [10, 25, 50, 100];

  filter: any = {
    pageNumber: 1,
    pageSize: 10,
    moduleName: undefined,
    actionByUserId: null,
    masterSiteId: null, 
    fromDate: null,
    toDate: null
  };

  constructor(
    private auditlogService: AuditlogService,
    private userService: UserService,
    private authService: AuthService,
    private masterSiteService: MasterSiteService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    const userRole = (user?.role || '').toLowerCase();
    
    this.isHospitalAdmin = userRole === 'hospitaladmin';
    this.isSuperAdmin = userRole === 'superadmin';

    this.loadHospitalDropdown();

    if (this.isHospitalAdmin) {
      this.filter.actionByUserId = user?.userId;
      this.filter.masterSiteId = user?.hospitalId || user?.masterSiteId || user?.siteId; 
      this.filter.moduleName = 'Users';
    } else {
      this.loadDropdownData();
    }
  }

  loadDropdownData() {
    this.userService.getUsers({ pageNumber: 1, pageSize: 500 }).subscribe({
      next: (res: any) => { 
        this.users = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  loadHospitalDropdown() {
    const dropdownPaging = { 
      pageNumber: 1, 
      pageSize: 300 ,
      isActive: true
    };

    this.masterSiteService.getSites(dropdownPaging).subscribe({
      next: (res: any) => {
        this.hospitals = res.data || res.result || res || [];
        this.cdr.detectChanges();
        this.search();
      },
      error: (err: any) => {
        console.error('Failed to load sites via MasterSiteService', err);
        this.search();
      }
    });
  }

  // 🟢 OPTIMIZED: The backend now maps names directly into 'masterSiteName'.
  // This frontend lookup engine remains as an instant fallback helper for missing data.
 getHospitalName(log: AuditLogResponseDto): string {

  // 1. BEST CASE: backend already resolved display name
  if (log.masterSiteName && log.masterSiteName.trim() &&
      log.masterSiteName !== 'System / Unknown') {
    return log.masterSiteName;
  }

  // 2. Detect SYSTEM / TEMPLATE actions (no real site context)
  const isSystemAction =
    !log.masterSiteId &&
    !log.recordId;

  if (isSystemAction) {
    return 'System / Template Action';
  }

  // 3. Resolve ID safely (site/product/template context)
  const targetId = log.masterSiteId || log.recordId;

  if (!targetId) {
    return 'System Action';
  }

  // 4. Local lookup (ONLY for enrichment, not source of truth)
  const foundSite = this.hospitals.find(h =>
    h.id === targetId || h.masterSiteId === targetId
  );

  // 5. NEVER show IDs or fallback #43 style values
  if (foundSite) {
    return foundSite.name?.trim()
      || foundSite.siteName?.trim()
      || 'Site information not available';
  }

  // 6. Safe fallback (important for deleted/missing refs)
  return 'Site / Hospital not available or not assigned';
}

  search() {
    this.loading = true;
    // 🟢 CHANGED: Typings safely map to accept AuditLogResponseDto structure
    this.auditlogService.searchAuditLogs(this.filter).subscribe({
      next: (res: PagedResponse<AuditLogResponseDto>) => {
        this.logs = res.data;
        this.totalRecords = res.totalRecords;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(event: any) {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.search();
  }

  reset() {
    const user = this.authService.getUser();
    this.filter = { 
      pageNumber: 1, 
      pageSize: 10,
      actionByUserId: this.isHospitalAdmin ? user?.userId : null,
      masterSiteId: this.isHospitalAdmin ? (user?.hospitalId || user?.masterSiteId || user?.siteId || null) : null,
      moduleName: this.isHospitalAdmin ? 'Users' : null,
      fromDate: null,
      toDate: null
    };
    this.search();
  }

  getModuleIcon(modName: string): string {
    if (!modName) return 'info';
    const formattedName = modName.trim().toLowerCase();
    
    if (formattedName === 'users' || formattedName === 'usermanagement') return 'person'; 
    if (formattedName === 'siteproducts' || formattedName === 'usersites') return 'layers';
    if (formattedName === 'templates') return 'description';
    if (formattedName === 'mastersites') return 'corporate_fare';

    return 'info';
  }
}
