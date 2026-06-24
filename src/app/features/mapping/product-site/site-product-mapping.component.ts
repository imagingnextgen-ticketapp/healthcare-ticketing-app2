import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation, ViewChild } from '@angular/core'; // 🔷 Added ViewChild
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
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
  
  // Data Arrays & Sources
  // 🔷 Converted to MatTableDataSource to allow pagination to operate
  dataSource = new MatTableDataSource<any>([]); 
  availableProducts: any[] = [];
  availableSites: any[] = [];
  
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

  /**
   * Triggered when Hospital Selection changes
   */
  onSiteChange(value: any): void {
    this.masterSiteId = value ? Number(value) : null;
    this.dataSource.data = []; // 🔷 Reset our table datasource wrapper
    this.selectedProductIds = [];
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

    this.siteProductService.getProductsViewDetails(this.masterSiteId).subscribe({
      next: (data: any) => {
        // Extract inner rows array safely from backend payload wrapping
        const rows = Array.isArray(data) ? data : (data.data || []);
        
        // 🔷 Bind the raw response list array directly inside our DataSource
        this.dataSource.data = rows;
        this.totalRecords = rows.length;

        // Link client-side paginator hook processing
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }

        this.cdr.detectChanges();
      },
      error: () => this.showSnackBar('Error loading assigned products')
    });
  }

  /**
   * Maps multiple products to the selected site
   */
  onAssignBulk(): void {
    if (this.isLoading || !this.masterSiteId || this.selectedProductIds.length === 0) return;

    this.isLoading = true;
    this.cdr.detectChanges();

    const dto = { 
      masterSiteId: this.masterSiteId, 
      productIds: this.selectedProductIds 
    };

    this.siteProductService.assignProducts(dto).subscribe({
      next: () => {
        this.showSnackBar('Products mapped successfully');
        this.selectedProductIds = [];
        this.isLoading = false;
        this.loadMappings();
      },
      error: (err) => {
        this.isLoading = false;
        
        // Extracting custom "ALREADY_ASSIGNED" message from C# Exception
        const errorMsg = err.error?.message || err.message || '';
        
        if (errorMsg.includes('ALREADY_ASSIGNED')) {
          const productNames = errorMsg.split(':')[1];
          this.snackBar.open(`Conflict: [${productNames}] are already mapped.`, 'Dismiss', {
            duration: 6000,
            panelClass: ['warning-snackbar']
          });
        } else {
          this.showSnackBar('Error occurred during mapping.');
        }
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
