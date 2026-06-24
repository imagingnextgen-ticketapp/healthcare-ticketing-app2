import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import { MasterSiteService } from '../../core/services/mastersite.service';
import { MasterSiteCreateComponent } from './mastersite-create.component';
import { MasterSiteDetailComponent } from './mastersite-detail.component';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  standalone: true,
  selector: 'app-mastersite-list',
  templateUrl: './mastersite-list.component.html',
  styleUrls: ['./mastersite-list.component.scss'],
  imports: [CommonModule, MaterialModules],
})
export class MasterSiteListComponent implements OnInit, OnDestroy {
  dataSource: any[] = [];
  totalRecords = 0;
  isLoading = false;
  
  filter = {
    Name: '', 
    pageNumber: 1,
    pageSize: 10
  };

  displayedColumns: string[] = ['name', 'phoneNumber', 'address', 'isActive', 'actions'];

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private service: MasterSiteService, 
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadSites();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchValue => {
      this.filter.Name = searchValue;
      this.filter.pageNumber = 1; 
      this.loadSites();
    });
  }

  loadSites(): void {
    this.isLoading = true;
    this.service.getSites(this.filter).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        this.dataSource = res.data || [];
        this.totalRecords = res.totalRecords || 0;
      },
      error: () => this.snackBar.open('Error loading data', 'Close')
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onPageChange(event: PageEvent): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.loadSites();
  }

  onAdd(): void {
    this.openDialog('create');
  }

  onEdit(site: any): void {
    this.openDialog('edit', site);
  }

  onView(site: any): void {
    this.dialog.open(MasterSiteDetailComponent, {
      width: '95vw',
      maxWidth: '1200px',
      height: '90vh',
      panelClass: 'fuji-view-panel',
      data: { site: site } 
    });
  }

  private openDialog(mode: string, site: any = null): void {
    const dialogRef = this.dialog.open(MasterSiteCreateComponent, {
      width: '550px',
      disableClose: mode !== 'view',
      data: { mode, site }
    });

    dialogRef.afterClosed().subscribe(refresh => {
      if (refresh) this.loadSites();
    });
  }

  onToggleStatus(site: any): void {
    const action = site.isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} ${site.name}?`)) {
      const request$ = site.isActive 
        ? this.service.deactivate(site.masterSiteId) 
        : this.service.activate(site.masterSiteId);

      request$.subscribe({
        next: () => {
          this.snackBar.open(`Site successfully ${action}d`, 'OK', { duration: 3000 });
          this.loadSites();
        },
        error: () => this.snackBar.open(`Failed to ${action}`, 'Close')
      });
    }
  }
}
