import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation, ViewChild } from '@angular/core'; // 🔷 Added ViewChild
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table'; // 🔷 Added MatTableDataSource
import { MatPaginator, PageEvent } from '@angular/material/paginator'; // 🔷 Added Paginator imports

// Services
import { SiteProductService } from '../../../core/services/site-product.service';
import { ProductService } from '../../../core/services/product.service';
import { MasterSiteService } from '../../../core/services/mastersite.service';

// Shared
import { MaterialModules } from '../../../shared/material.collection';

@Component({
  selector: 'app-site-product-mapping',
  standalone: true,
  imports: [CommonModule, MaterialModules, FormsModule],
  templateUrl: './site-product-mapping.component.html',
  styleUrls: ['./site-product-mapping.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SiteProductMappingComponent implements OnInit {
  // Selection Models
  masterSiteId: number | null = null;
  selectedProductIds: number[] = [];
  assignedProductIds = new Set<number>();
  isLoadingAssignedProducts = false;
  assignedProductsLookupFailed = false;
  
  // Data Arrays & Sources
  // 🔷 Converted to MatTableDataSource to allow pagination to operate
  dataSource = new MatTableDataSource<any>([]); 
  availableProducts: any[] = [];
  availableSites: any[] = [];
  siteSearchControl = new FormControl<string | any>('');
  productSearchControl = new FormControl({ value: '', disabled: true });
  
  // 🔷 Pagination Properties needed for UI template layout
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions: number[] = Array.of(5, 10, 25, 50, 100);

  // 🔷 Link ViewChild hook element from the HTML template 
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  // UI State
  isLoading = false;
  displayedColumns: string[] = ['hospitalName', 'productName', 'status', 'actions'];

  constructor(
    private siteProductService: SiteProductService,
    private productService: ProductService,
    private masterSiteService: MasterSiteService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Loads Hospitals and Products for the dropdowns
   */
  loadInitialData(): void {
    // 🟢 HERE IS THE FIX: Added 'isActive: true' inside the payload object
    this.masterSiteService.getSites({ pageNumber: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res: any) => {
        this.availableSites = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => this.showSnackBar('Failed to load hospitals')
    });

    // Load Active Products
    this.productService.getProducts({ pageNumber: 1, pageSize: 1000, isActive: true }).subscribe({
      next: (res: any) => {
        this.availableProducts = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => this.showSnackBar('Failed to load products')
    });
  }

  get filteredSites(): any[] {
    const value = this.siteSearchControl.value;
    const query = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return query
      ? this.availableSites.filter(site => (site.name || site.siteName || '').toLowerCase().includes(query))
      : this.availableSites;
  }

  displaySite(site: any): string {
    return typeof site === 'string' ? site : site?.name || site?.siteName || '';
  }

  onSiteSelected(site: any): void {
    const siteId = Number(site?.masterSiteId ?? site?.id ?? site?.Id);
    if (!siteId) return;

    this.siteSearchControl.setValue(site, { emitEvent: false });
    this.onSiteChange(siteId);
  }

  onSiteSearchInput(): void {
    if (typeof this.siteSearchControl.value !== 'string') return;

    this.masterSiteId = null;
    this.selectedProductIds = [];
    this.assignedProductIds.clear();
    this.isLoadingAssignedProducts = false;
    this.assignedProductsLookupFailed = false;
    this.productSearchControl.disable({ emitEvent: false });
    this.dataSource.data = [];
    this.totalRecords = 0;
    this.currentPage = 1;
  }

  get filteredAvailableProducts(): any[] {
    const value = this.productSearchControl.value;
    const query = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return this.availableProducts.filter(product => !query || product.name?.toLowerCase().includes(query));
  }

  isProductAssigned(productId: number): boolean {
    return this.assignedProductIds.has(Number(productId));
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProductIds.some(id => Number(id) === Number(productId));
  }

  toggleProduct(productId: number, input: HTMLInputElement): void {
    if (this.isProductAssigned(productId)) return;

    if (this.isProductSelected(productId)) {
      this.selectedProductIds = this.selectedProductIds.filter(id => Number(id) !== Number(productId));
    } else {
      this.selectedProductIds = [...this.selectedProductIds, Number(productId)];
    }
    setTimeout(() => {
      input.value = '';
      this.productSearchControl.setValue('');
    });
  }

  clearSelectedProducts(): void {
    this.selectedProductIds = [];
  }

  /**
   * Triggered when Hospital Selection changes
   */
  onSiteChange(value: any): void {
    this.masterSiteId = value ? Number(value) : null;
    this.dataSource.data = []; // 🔷 Reset our table datasource wrapper
    this.selectedProductIds = [];
    this.assignedProductIds.clear();
    this.currentPage = 1; // Reset back to page 1 on site change
    
    if (this.masterSiteId) {
      this.loadMappings();
    }
    this.cdr.detectChanges();
  }

  /**
   * Loads current mappings for the selected site
   */
  loadMappings(): void {
    if (!this.masterSiteId) return;

    const siteId = this.masterSiteId;
    this.isLoadingAssignedProducts = true;
    this.assignedProductsLookupFailed = false;
    this.productSearchControl.disable({ emitEvent: false });
    this.siteProductService.getProductsViewDetails(siteId).subscribe({
      next: (data: any) => {
        if (siteId !== this.masterSiteId) return;
        // Extract inner rows array safely from backend payload wrapping
        const rows = Array.isArray(data) ? data : (data.data || []);
        this.assignedProductIds = new Set<number>(
          rows.map((row: any) => Number(row.productId ?? row.ProductId)).filter((id: number) => Number.isFinite(id))
        );
        this.isLoadingAssignedProducts = false;
        this.productSearchControl.enable({ emitEvent: false });
        
        // 🔷 Bind the raw response list array directly inside our DataSource
        this.dataSource.data = rows;
        this.totalRecords = rows.length;

        // Link client-side paginator hook processing
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        if (siteId !== this.masterSiteId) return;
        this.isLoadingAssignedProducts = false;
        this.assignedProductsLookupFailed = true;
        this.showSnackBar('Error loading assigned products');
      }
    });
  }

  /**
   * Maps multiple products to the selected site
   */
 onAssignBulk(): void {
  if (this.isLoading || this.isLoadingAssignedProducts || this.assignedProductsLookupFailed || !this.masterSiteId || this.selectedProductIds.length === 0) {
    return;
  }

  this.isLoading = true;
  this.cdr.detectChanges();

  const dto = {
    masterSiteId: this.masterSiteId,
    productIds: this.selectedProductIds
  };

  this.siteProductService.assignProducts(dto).subscribe({
    next: (response: any) => {

      const message =
        typeof response === 'string'
          ? response
          : response?.message || 'Products processed successfully.';

      this.showSnackBar(message);

      this.selectedProductIds = [];
      this.isLoading = false;

      this.loadMappings();
    },

    error: (err: any) => {

      this.isLoading = false;

      let message = 'Failed to process products';

      try {
        if (typeof err.error === 'string') {
          const parsed = JSON.parse(err.error);
          message = parsed.message;
        } else if (err.error?.message) {
          message = err.error.message;
        }
      } catch {
        message = err.error || message;
      }

      this.showSnackBar(message);
      this.cdr.detectChanges();
    }
  });
}
  /**
   * 🔷 Added to track client pagination interactions
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
  }

  /**
   * Handles Status Updates using separate Activate/Deactivate calls
   * Aligned with the two-icon design
   */
  updateProductStatus(product: any, shouldActivate: boolean): void {
    if (!this.masterSiteId) return;

    const dto = { 
      masterSiteId: this.masterSiteId, 
      productId: product.productId 
    };

    const request$ = shouldActivate 
      ? this.siteProductService.activateProduct(dto) 
      : this.siteProductService.deactivateProduct(dto);

    request$.subscribe({
      next: () => {
        this.showSnackBar(`Product ${shouldActivate ? 'activated' : 'deactivated'}`);
        this.loadMappings(); // Refresh table
      },
      error: () => this.showSnackBar('Error updating status')
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
