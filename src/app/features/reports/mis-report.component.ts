import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MaterialModules } from '../../shared/material.collection';
import { MisServiceReport } from '../../core/services/mis-report.service';
import { TemplateService } from '../../core/services/template.service';
import { MasterSiteService } from '../../core/services/mastersite.service';
import { MisFilterDto, MisReportDto } from '../../core/models/mis-report.model';
import { SiteProductService } from '../../core/services/site-product.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-mis-report',
  standalone: true,
  imports: [CommonModule, MaterialModules, FormsModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './mis-report.component.html',
  styleUrls: ['./mis-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisReportComponent implements OnInit {
  dataSource: MisReportDto[] = [];
  displayedColumns: string[] = [
  'ticketId',
  'hospitalName',
  'productName',
  'issueType',
  'assignedTo',
  'closedBy',
  'severity',
  'status',
  'createdDate',
  'closedDate',
  'actualTatHours'
];
  private dashboardNavigation = false;
  masterSites: any[] = [];
  filteredMasterSites: any[] = [];
  siteSearchText = '';
  products: any[] = [];
  filteredProducts: any[] = [];
  productSearchText = '';
  templates: any[] = [];
  filteredTemplates: any[] = [];
  templateSearchText = '';
  engineers: any[] = [];
  filteredEngineers: any[] = [];
  assignedToSearchText = '';
  activeUsers: any[] = [];
  filteredActiveUsers: any[] = [];
  closedBySearchText = '';
  statuses: { value: string; label: string }[] = [
    { value: 'Open', label: 'Open' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Reopened', label: 'Reopened' }
  ];
  filteredStatuses: { value: string; label: string }[] = [...this.statuses];
  statusSearchText = '';
  
  totalRecords = 0;
  isLoading = false;
  isHospitalAdmin = false;

 filter: MisFilterDto = {
  pageNumber: 1,
  pageSize: 10,

  fromDate: undefined,
  toDate: undefined,

  masterSiteId: undefined,
  productId: undefined,
  templateId: undefined,

  assignedToUserId: undefined,
  closedByUserId: undefined,

  tatHours: undefined,
  tatOperator: 'gt',

  // Dashboard / MIS status filters
  status: undefined,
  escalated: undefined,
  dashboardFilter: undefined  
};

  constructor(
    private misService: MisServiceReport, 
    private route: ActivatedRoute,
    private masterSiteService: MasterSiteService,
    private templateService: TemplateService,
    private siteproductService: SiteProductService,
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {

  this.loadEngineers();
  this.loadActiveUsers();

  this.route.queryParams.subscribe(params => {

    const fromDate = params['fromDate'];
    const toDate = params['toDate'];
    const status = params['status'];
    const escalated = params['escalated'];
    const dashboardFilter = params['dashboardFilter'];

    // ✅ Fix 1: Fixed the semicolon typo to properly include dashboardFilter
    this.dashboardNavigation =
      !!fromDate ||
      !!toDate ||
      !!status ||
      escalated === 'true' ||
      dashboardFilter === 'opened';

    // ✅ Fix 2: Reset filter variables to baseline defaults on every URL emission
    // This stops state leakage when shifting between different summary cards
    this.filter.fromDate = fromDate || null;
    this.filter.toDate = toDate || null;
    this.filter.status = status || '';
    this.filter.dashboardFilter = dashboardFilter || '';
    this.filter.escalated = escalated === 'true';

    // Reset pagination to first page when changing dashboard filter scopes
    this.filter.pageNumber = 1;

    this.initUserAndData();
  });
}

  initUserAndData(): void {
    const user = this.authService.getUser();
    if (user) {
      const userRole = (user.role || '').toLowerCase();
      const assignedSiteId = user.masterSiteId;
      this.isHospitalAdmin = userRole === 'hospitaladmin';

      if (this.isHospitalAdmin && assignedSiteId) {
        this.isLoading = true;
        this.cdr.detectChanges();
        this.masterSiteService.getSiteViewDetails(Number(assignedSiteId)).subscribe({
          next: (res: any) => {
            this.masterSites = [res]; 
            this.filteredMasterSites = [...this.masterSites];
            this.siteSearchText = res.name || res.hospitalName || '';
            this.filter = { ...this.filter, masterSiteId: Number(assignedSiteId) };
            this.onSiteChange(this.filter.masterSiteId); 
          },
          error: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      } else {
        this.loadAllSites();
      }
    } else {
      this.loadAllSites();
    }
  }

  /**
   * 🚀 SITE CHANGE: Loads Products
   */
  onSiteChange(siteId: any): void {
    if (siteId === null || siteId === undefined || siteId === '') {
      this.products = [];
      this.filteredProducts = [];
      this.productSearchText = '';
      this.templates = [];
      this.filteredTemplates = [];
      this.templateSearchText = '';
      this.filter = { ...this.filter, masterSiteId: undefined, productId: undefined, templateId: undefined };
      this.applyFilters();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const targetSiteId = Number(siteId);

    this.siteproductService.getProductsViewDetails(targetSiteId).subscribe({
      next: (res: any) => {
        this.products = res && Array.isArray(res) ? [...res] : (res?.data ? [...res.data] : []); 
        this.filteredProducts = [...this.products];
        this.productSearchText = '';
        this.templates = [];
        this.filteredTemplates = [];
        this.templateSearchText = '';
        this.filter = { ...this.filter, masterSiteId: targetSiteId, productId: undefined, templateId: undefined };
        this.isLoading = false;
        this.applyFilters();
      },
      error: () => { 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
      }
    });
  }

  private loadEngineers(): void {
  this.userService.getEngineers().subscribe({
    next: (res) => {
      this.engineers = res || [];
      this.filteredEngineers = [...this.engineers];
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Failed to load engineers:', error);
      this.engineers = [];
      this.filteredEngineers = [];
      this.cdr.detectChanges();
    }
  });
}

private loadActiveUsers(): void {
  this.userService.getActiveUsers().subscribe({
    next: (res) => {
      this.activeUsers = res || [];
      this.filteredActiveUsers = [...this.activeUsers];
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Failed to load active users:', error);
      this.activeUsers = [];
      this.filteredActiveUsers = [];
      this.cdr.detectChanges();
    }
  });
}

  formatTat(hours: number): string {
  const totalMinutes = Math.round(hours * 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

  /**
   * 🚀 PRODUCT CHANGE: Loads Issue Types (Templates)
   */
  onProductChange(productId: any): void {
    if (productId === null || productId === undefined || productId === '') {
      this.templates = [];
      this.filteredTemplates = [];
      this.templateSearchText = '';
      this.filter = { ...this.filter, productId: undefined, templateId: undefined };
      this.applyFilters();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const targetProductId = isNaN(productId) ? productId : Number(productId);

    this.templateService.getTemplateViewByProduct(targetProductId).subscribe({
      next: (res: any) => {
        this.templates = res && Array.isArray(res) ? [...res] : (res?.data ? [...res.data] : []); 
        this.filteredTemplates = [...this.templates];
        this.templateSearchText = '';
        this.filter = { ...this.filter, productId: targetProductId, templateId: undefined };
        this.isLoading = false;
        this.applyFilters();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * 🔎 PRODUCT SEARCH: Filters product dropdown options by typed text
   */
  filterProducts(searchText: string): void {
    const term = (searchText || '').trim().toLowerCase();

    this.filteredProducts = !term
      ? [...this.products]
      : this.products.filter((p: any) =>
          ((p.name || p.productName || '') as string).toLowerCase().includes(term)
        );
  }

  /**
   * ✅ PRODUCT SELECTED: Fired when a product is picked from the autocomplete panel
   */
  onProductSelected(productId: any): void {
    this.filter = { ...this.filter, productId };
    this.onProductChange(productId);
  }

  private getProductId(p: any): any {
    return p.id !== undefined && p.id !== null ? p.id : p.productId;
  }

  displayProductName = (productId: any): string => {
    if (productId === null || productId === undefined) return '';
    const product = this.products.find((p: any) => this.getProductId(p) === productId);
    return product ? (product.name || product.productName || '') : '';
  };

  /**
   * 🔎 ISSUE TYPE SEARCH: Filters issue type dropdown options by typed text
   */
  filterTemplates(searchText: string): void {
    const term = (searchText || '').trim().toLowerCase();

    this.filteredTemplates = !term
      ? [...this.templates]
      : this.templates.filter((t: any) =>
          ((t.issueType || '') as string).toLowerCase().includes(term)
        );
  }

  /**
   * ✅ ISSUE TYPE SELECTED: Fired when an issue type is picked from the autocomplete panel
   */
  onTemplateSelected(templateId: any): void {
    this.filter = { ...this.filter, templateId };
    this.applyFilters();
  }

  displayTemplateName = (templateId: any): string => {
    if (templateId === null || templateId === undefined) return '';
    const template = this.templates.find((t: any) => t.templateId === templateId);
    return template ? (template.issueType || '') : '';
  };

  /**
   * 🔎 ASSIGNED TO SEARCH: Filters engineer dropdown options by typed text
   */
  filterEngineers(searchText: string): void {
    const term = (searchText || '').trim().toLowerCase();

    this.filteredEngineers = !term
      ? [...this.engineers]
      : this.engineers.filter((e: any) =>
          ((e.userName || '') as string).toLowerCase().includes(term)
        );
  }

  onAssignedToSelected(userId: any): void {
    this.filter = { ...this.filter, assignedToUserId: userId };
    this.applyFilters();
  }

  displayEngineerName = (userId: any): string => {
    if (userId === null || userId === undefined) return '';
    const engineer = this.engineers.find((e: any) => e.userId === userId);
    return engineer ? (engineer.userName || '') : '';
  };

  /**
   * 🔎 CLOSED BY SEARCH: Filters active user dropdown options by typed text
   */
  filterActiveUsers(searchText: string): void {
    const term = (searchText || '').trim().toLowerCase();

    this.filteredActiveUsers = !term
      ? [...this.activeUsers]
      : this.activeUsers.filter((u: any) =>
          ((u.userName || '') as string).toLowerCase().includes(term)
        );
  }

  onClosedBySelected(userId: any): void {
    this.filter = { ...this.filter, closedByUserId: userId };
    this.applyFilters();
  }

  displayActiveUserName = (userId: any): string => {
    if (userId === null || userId === undefined) return '';
    const user = this.activeUsers.find((u: any) => u.userId === userId);
    return user ? (user.userName || '') : '';
  };

  /**
   * 🔎 STATUS SEARCH: Filters status dropdown options by typed text
   */
  filterStatuses(searchText: string): void {
    const term = (searchText || '').trim().toLowerCase();

    this.filteredStatuses = !term
      ? [...this.statuses]
      : this.statuses.filter((s) => s.label.toLowerCase().includes(term));
  }

  onStatusSelected(status: any): void {
    this.filter = { ...this.filter, status };
    this.applyFilters();
  }

  displayStatusName = (status: any): string => {
    if (status === null || status === undefined) return '';
    const match = this.statuses.find((s) => s.value === status);
    return match ? match.label : '';
  };

  loadReportData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
console.log('MIS FILTER SENT:', this.filter);
    this.misService.getConsolidatedReport(this.filter).subscribe({
      next: (res) => {
        this.dataSource = res && res.data ? [...res.data] : [];
        this.totalRecords = res ? res.totalRecords : 0;
        this.isLoading = false;
        this.cdr.detectChanges();
        //console.log('MIS FILTER:', this.filter);
      },
      error: () => { 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
      }
    });
  }

  private loadAllSites(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.masterSiteService.getSites({ pageNumber: 1, pageSize: 300 }).subscribe({
      next: (res) => {
        this.masterSites = (res.data || []).filter((site: any) => site.isActive);
        this.filteredMasterSites = [...this.masterSites];

        this.loadReportData();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * 🔎 SITE SEARCH: Filters hospital dropdown options by typed text
   */
  filterSites(searchText: string): void {
    const term = (searchText || '').trim().toLowerCase();

    this.filteredMasterSites = !term
      ? [...this.masterSites]
      : this.masterSites.filter((s: any) =>
          ((s.name || s.hospitalName || '') as string).toLowerCase().includes(term)
        );
  }

  /**
   * ✅ SITE SELECTED: Fired when a hospital is picked from the autocomplete panel
   */
  onSiteSelected(siteId: any): void {
    this.filter = { ...this.filter, masterSiteId: siteId };
    this.onSiteChange(siteId);
  }

  displaySiteName = (siteId: any): string => {
    if (siteId === null || siteId === undefined) return '';
    const site = this.masterSites.find((s: any) => s.masterSiteId === siteId);
    return site ? (site.name || site.hospitalName || '') : '';
  };

  applyFilters(): void {
    this.filter = { ...this.filter, pageNumber: 1 };
    this.loadReportData();
  }

  /**
   * 🟢 RESET: Optimized high-speed layout state initialization
   */
  resetFilters(): void {
    const user = this.authService.getUser();
    const assignedSiteId = user?.masterSiteId;

   this.filter = {
  pageNumber: 1,
  pageSize: 10,
  tatOperator: 'gt',

  masterSiteId: this.isHospitalAdmin
    ? Number(assignedSiteId)
    : undefined,

  productId: undefined,
  templateId: undefined,
  fromDate: undefined,
  toDate: undefined,
  tatHours: undefined,
  status: undefined,

  assignedToUserId: undefined,
  closedByUserId: undefined
};
    this.siteSearchText = this.isHospitalAdmin ? this.displaySiteName(Number(assignedSiteId)) : '';
    this.filteredMasterSites = this.masterSites.map(s => ({ ...s }));
    this.productSearchText = '';
    this.templateSearchText = '';
    this.assignedToSearchText = '';
    this.closedBySearchText = '';
    this.statusSearchText = '';
    this.filteredEngineers = this.engineers.map(s => ({ ...s }));
    this.filteredActiveUsers = this.activeUsers.map(s => ({ ...s }));
    this.filteredStatuses = this.statuses.map(s => ({ ...s }));
    // FIX: Decouple operational states from structural service network endpoints to achieve fast loading
    if (this.isHospitalAdmin) {
      this.templates = [];
      this.filteredTemplates = [];
      this.filteredProducts = this.products.map(s => ({ ...s }));
      this.loadReportData();
    } else {
      this.products = [];
      this.filteredProducts = [];
      this.templates = [];
      this.filteredTemplates = [];
      this.loadReportData();
    }
  }


  getStatusLabel(s: any): string {
  if (s === null || s === undefined) return 'Open';

  const value = String(s).trim().toLowerCase();

  const map: any = {
    '1': 'Open',
    'open': 'Open',

    '2': 'Assigned',
    'assigned': 'Assigned',

    '3': 'InProgress',
    'inprogress': 'In Progress',
    'in progress': 'In Progress',

    '4': 'Closed',
    'closed': 'Closed',

    '5': 'Reopened',
    'reopened': 'Reopened'
  };

  return map[value] || map[String(Number(value))] || 'Open';
}
  getSeverityLabel = (s: any): string => {
  const map: any = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical',
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
    Critical: 'Critical'
  };

  return map[s] || 'Low';
};

getSeverityClass = (s: any): string => {
  const map: any = {
    1: 'low',
    2: 'medium',
    3: 'high',
    4: 'critical',
    Low: 'low',
    Medium: 'medium',
    High: 'high',
    Critical: 'critical'
  };

  return map[s] || 'low';
};
  handleExport(): void {
    this.misService.exportConsolidated(this.filter).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FUJI_Report_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  onPageChange(event: any): void {
    this.filter = {
      ...this.filter,
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize
    };
    this.loadReportData();
  }
}
