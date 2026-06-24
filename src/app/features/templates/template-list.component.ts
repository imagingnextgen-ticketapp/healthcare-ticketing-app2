import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { TemplateFilter, TemplateResponseDto } from '../../core/models/template.model';
import { TemplateService } from '../../core/services/template.service';
import { TemplateCreateComponent } from './template-create.component';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, MaterialModules],
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.scss']
})
export class TemplateListComponent implements OnInit {
  displayedColumns: string[] = ['productName', 'issueType', 'slaHours', 'severity', 'priority', 'description', 'actions'];

  dataSource: TemplateResponseDto[] = [];
  totalRecords = 0;
  isLoading = false;

  filter: TemplateFilter = {
    pageNumber: 1,
    pageSize: 10,
    search: ''
  };

  private searchSubject = new Subject<string>();

  constructor(
    private templateService: TemplateService, 
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(val => {
      this.filter.search = val;
      this.filter.pageNumber = 1;
      this.loadTemplates();
    });
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.templateService.getTemplates(this.filter).subscribe({
      next: (res) => {
        this.dataSource = res.data || [];
        this.totalRecords = res.totalRecords || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Production-ready Activation Toggle
   * Replaces Delete functionality with Status Management
   */
  toggleActivation(template: TemplateResponseDto): void {
    const isCurrentlyActive = template.isActive;
    const request$ = isCurrentlyActive 
      ? this.templateService.deactivateTemplate(template.templateId) 
      : this.templateService.activateTemplate(template.templateId);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          `Template ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully`, 
          'OK', 
          { duration: 3000, panelClass: ['fuji-snackbar'] }
        );
        this.loadTemplates();
      },
      error: (err) => {
        this.snackBar.open(err.error || 'Operation failed', 'Close', { duration: 4000 });
      }
    });
  }

getSeverityLabel(val: any): string {
  if (!val) return 'Unknown';

  const normalized = val.toString().trim().toLowerCase();

  const map: Record<string, string> = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'critical': 'Critical'
  };

  return map[normalized] || 'Unknown';
}
// 2. Add this helper method to format Priority labels cleanly
getPriorityLabel(val: any): string {
  if (!val) return 'Unknown';
  const standardizedStr = val.toString().trim().toLowerCase();
  
  const priorityMap: Record<string, string> = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'critical': 'Critical'
  };
  
  return priorityMap[standardizedStr] || val;
}



  onSearch(event: any): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onPageChange(event: PageEvent): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.loadTemplates();
  }

  openTemplateDialog(template?: TemplateResponseDto): void {
    const dialogRef = this.dialog.open(TemplateCreateComponent, {
      width: '700px',
      data: template,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadTemplates();
    });
  }
}
