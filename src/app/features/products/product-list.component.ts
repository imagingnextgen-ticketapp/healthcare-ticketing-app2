import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator'; 
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// Internal Imports
import { ProductService } from '../../core/services/product.service';
import { ProductCreateComponent } from './product-create.component';
import { MaterialModules } from '../../shared/material.collection';
import { UpdateProductDto } from '../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, MaterialModules],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['productName', 'isActive', 'createdDate', 'actions'];
  
  // 🔷 Pagination Settings
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;
  
  // 🟢 Fixed syntax rendering bypass constructor
  pageSizeOptions: number[] = Array.of(5, 10, 25, 50, 100); 

  // 🔷 Link to template paginator
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Search properties
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentSearchTerm = '';

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar 
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    // Setup Search Debounce
    this.searchSubject.pipe(
      debounceTime(400),          
      distinctUntilChanged(),     
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.currentSearchTerm = searchTerm;
      this.currentPage = 1;       
      this.loadProducts(searchTerm);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue.trim());
  }

  /**
   * Fetches data with Pagination arguments
   */
  loadProducts(searchTerm: string = this.currentSearchTerm): void {
    this.productService.getProducts({ 
      pageNumber: this.currentPage, 
      pageSize: this.pageSize,       
      name: searchTerm 
    }).subscribe({
      next: (res: any) => {
        const data = res.data || res; 
        this.dataSource.data = Array.isArray(data) ? data : [];
        
        // Dynamic map total record count from backend
        this.totalRecords = res.totalRecords || res.totalCount || this.dataSource.data.length;
        
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Fetch Error:', err);
        this.snackBar.open('Failed to load products from server', 'Close', { 
          panelClass: ['error-snackbar'],
          duration: 5000 
        });
      }
    });
  }

  /**
   * Captures template pagination interaction clicks
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1; 
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  toggleStatus(product: any): void {
    const id = product.ProductId || product.productId;
    const isCurrentlyActive = product.IsActive ?? product.isActive;

    const request = isCurrentlyActive 
      ? this.productService.deactivateProduct(id) 
      : this.productService.activateProduct(id);

    request.subscribe({
      next: (message: string) => {
        this.snackBar.open(message, 'OK', { duration: 3000 });
        this.loadProducts(); 
      },
      error: (err) => {
        console.error('Status Toggle Error:', err);
        const errorMessage = err.error || 'Failed to update product status';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  onAddProduct(): void {
    const dialogRef = this.dialog.open(ProductCreateComponent, {
      width: '550px',
      disableClose: true,
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
        this.snackBar.open('New product added to catalog', 'OK', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  onEdit(product: any): void {
    const productToEdit: UpdateProductDto = {
      productId: product.ProductId || product.productId,
      name: product.Name || product.name,
      isActive: product.IsActive !== undefined ? product.IsActive : product.isActive
    };

    const dialogRef = this.dialog.open(ProductCreateComponent, {
      width: '550px',
      disableClose: true,
      data: { 
        mode: 'edit', 
        product: productToEdit 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
        this.snackBar.open('Product details updated', 'OK', { duration: 3000 });
      }
    });
  }
}
