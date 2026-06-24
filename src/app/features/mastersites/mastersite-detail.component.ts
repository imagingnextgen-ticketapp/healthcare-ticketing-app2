import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Services
import { UserSiteService } from '../../core/services/user-site.service';
import { SiteProductService } from '../../core/services/site-product.service';
import { TemplateService } from '../../core/services/template.service';
import { MaterialModules } from '../../shared/material.collection';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mastersite-detail',
  standalone: true, // Ensured standalone config matches modern imports
  imports: [CommonModule, ...MaterialModules],
  templateUrl: './mastersite-detail.component.html',
  styleUrls: ['./mastersite-detail.component.scss']
})
export class MasterSiteDetailComponent implements OnInit {
  site: any;
  siteId!: number;
  
  // Data storage
  users: any[] = [];
  products: any[] = [];
  
  // Template lazy-loading storage
  productTemplates: { [productId: number]: any[] } = {};
  loadingTemplates: { [productId: number]: boolean } = {};
  
  isLoading = false;

  // ⚡ ADDED: State trackers to hold dialog metadata summary if needed by template
  totalUsersCount = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cdr: ChangeDetectorRef,
    private userSiteService: UserSiteService,
    private productSiteService: SiteProductService,
    private templateService: TemplateService
  ) {
    this.site = data.site;
    this.siteId = this.site?.masterSiteId || this.site?.siteId;
  }

  ngOnInit(): void {
    if (this.siteId) {
      this.loadMappings();
    }
  }

  /** ✅ API 1 & 2: Load Users and Products in Parallel */
  loadMappings() {
    this.isLoading = true;
    this.cdr.detectChanges();

    forkJoin({
      // ⚡ FIXED: Added default pagination indices (Page 1, 10 Items) to match updated service signature
      usersEnvelope: this.userSiteService.getUsersBySite(this.siteId, 1, 10).pipe(
        catchError(() => of({ data: [], totalRecords: 0 }))
      ),
      products: this.productSiteService.getProductsViewDetails(this.siteId).pipe(
        catchError(() => of([]))
      )
    }).subscribe(res => {
      // ⚡ FIXED: Extracted the .data array component to satisfy compilation constraints
      this.users = res.usersEnvelope.data || [];
      this.totalUsersCount = res.usersEnvelope.totalRecords || 0;
      
      this.products = res.products;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  /** ✅ API 3: Hierarchical load for Templates (only when Product is clicked) */
  onExpandProduct(productId: number) {
    if (this.productTemplates[productId]) return; 

    this.loadingTemplates[productId] = true;
    this.cdr.detectChanges();

    this.templateService.getTemplateViewByProduct(productId).subscribe({
      next: (res) => {
        this.productTemplates[productId] = res;
        this.loadingTemplates[productId] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTemplates[productId] = false;
        this.cdr.detectChanges();
      }
    });
  }
}
