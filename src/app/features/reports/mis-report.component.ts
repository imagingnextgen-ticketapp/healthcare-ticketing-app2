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
  displayedColumns: string[] = ['ticketId', 'hospitalName', 'productName', 'issueType', 'severity', 'status', 'createdDate', 'closedDate', 'actualTatHours'];
  
  masterSites: any[] = [];
  products: any[] = [];
  templates: any[] = [];
  
  totalRecords = 0;
  isLoading = false;
  isHospitalAdmin = false;

  filter: MisFilterDto = { 
    pageNumber: 1, pageSize: 10, fromDate: undefined, toDate: undefined,
    masterSiteId: undefined, productId: undefined, templateId: undefined, 
    tatHours: undefined, tatOperator: 'gt' 
  };

  constructor(
    private misService: MisServiceReport, 
    private masterSiteService: MasterSiteService,
    private templateService: TemplateService,
    private siteproductService: SiteProductService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { 
    this.initUserAndData();
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
      this.templates = [];
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
        this.templates = [];
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

  /**
   * 🚀 PRODUCT CHANGE: Loads Issue Types (Templates)
   */
  onProductChange(productId: any): void {
    if (productId === null || productId === undefined || productId === '') {
      this.templates = [];
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

  loadReportData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.misService.getConsolidatedReport(this.filter).subscribe({
      next: (res) => {
        this.dataSource = res && res.data ? [...res.data] : [];
        this.totalRecords = res ? res.totalRecords : 0;
        this.isLoading = false;
        this.cdr.detectChanges();
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
    this.masterSiteService.getSites({ pageNumber: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        this.masterSites = res.data || [];
        this.loadReportData();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

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
      masterSiteId: this.isHospitalAdmin ? Number(assignedSiteId) : undefined,
      productId: undefined, 
      templateId: undefined, 
      fromDate: undefined, 
      toDate: undefined, 
      tatHours: undefined
    };

    // FIX: Decouple operational states from structural service network endpoints to achieve fast loading
    if (this.isHospitalAdmin) {
      this.templates = [];
      this.loadReportData();
    } else {
      this.products = [];
      this.templates = [];
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
