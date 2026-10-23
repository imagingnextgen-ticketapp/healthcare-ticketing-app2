import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';;
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../shared/material.collection';
import { TicketService } from '../../core/services/ticket.service';
import { UserService } from '../../core/services/user.service'; 
import { TicketHistoryDto } from '../../core/models/tickethistory.model';
import { TicketHistoryFilterDto } from '../../core/models/tickethistory.model';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ticket-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MaterialModules],
  providers: [provideNativeDateAdapter()],
  templateUrl: './ticket-history.component.html',
  styleUrls: ['./ticket-history.component.scss']
})
export class TicketHistoryComponent implements OnInit {
  @Input() ticketId!: number;
  
  historyLogs: TicketHistoryDto[] = [];
  users: any[] = []; 
  totalRecords = 0;
  isLoading = false;
  isExporting = false;
  readonly maxDate = new Date();

  filter = {
  ticketId: undefined as number | undefined,
  fromDate: undefined as Date | string | undefined,
  toDate: undefined as Date | string | undefined,
  actionByUserId: undefined as number | undefined,
  pageNumber: 1,
  pageSize: 10
};

  constructor(
    private ticketService: TicketService, 
    private userService: UserService, 
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

 ngOnInit(): void {

  // Read ticketId when opened from Worklist
  const ticketIdParam =
    this.route.snapshot.queryParamMap.get('ticketId');

  if (ticketIdParam) {
    this.ticketId = Number(ticketIdParam);
  }

  // Set Ticket ID only when it is provided by the parent
  if (this.ticketId) {
    this.filter.ticketId = this.ticketId;
  }

  // Load active users for Action By dropdown
  this.loadUsersLookup();

  // Load history
  this.loadHistory();
}

  /**
   * Fetches users to populate the "Action By User" dropdown
   */
  loadUsersLookup(): void {
    this.userService.getUsers({ pageNumber: 1, pageSize: 100, isActive: true }).subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('User lookup failed', err)
    });
  }

  /**
   * Main execution method for fetching history records
   */
  loadHistory(): void {
    if (!this.isDateRangeValid()) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    // Deep clone filter to format dates safely without corrupting UI ngModel bindings
    const requestPayload = {
      ...this.filter,
      fromDate: this.filter.fromDate ? this.formatDate(this.filter.fromDate) : undefined,
      toDate: this.filter.toDate ? this.formatDate(this.filter.toDate) : undefined
    };

    // Clean up "All Users" selection if it defaults to 0
    if (requestPayload.actionByUserId === 0) {
      requestPayload.actionByUserId = undefined;
    }

    this.ticketService.getTicketHistory(requestPayload).subscribe({
      next: (res) => {
        this.historyLogs = res.data ? [...res.data] : [];
        this.totalRecords = res.totalRecords || 0;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('History API error:', err);
        this.isLoading = false;
        this.historyLogs = [];
        this.totalRecords = 0;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Clear active filter values and return to baseline pagination parameters
   */
 resetFilters(): void {
  this.filter = {
    ticketId: this.ticketId || undefined,
    fromDate: undefined,
    toDate: undefined,
    actionByUserId: undefined,
    pageNumber: 1,
    pageSize: 10
  };

  this.loadHistory();
}
  /**
   * Triggered by the "Search" button or dropdown selection change
   */
  applyFilters(): void {
    // Reset to first page for new search scope contexts
    this.filter.pageNumber = 1;
    this.loadHistory();
  }

  exportHistory(): void {
    if (!this.isDateRangeValid()) {
      return;
    }

    const exportFilter: TicketHistoryFilterDto = {
      ticketId: this.filter.ticketId,
      fromDate: this.filter.fromDate,
      toDate: this.filter.toDate,
      actionByUserId: this.filter.actionByUserId
    };

    this.isExporting = true;
    this.ticketService.exportTicketHistory(exportFilter).subscribe({
      next: (file) => {
        const url = window.URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AuditTrail_${this.createExportTimestamp()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        this.isExporting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ticket history export failed:', err);
        this.isExporting = false;
        this.cdr.detectChanges();
        this.snackBar.open('Failed to export audit history.', 'Close', { duration: 3000 });
      }
    });
  }

  private createExportTimestamp(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `${date}_${time}`;
  }

  /**
   * Handles pagination events
   */
  onPageChange(event: any): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.loadHistory();
  }

  /**
   * 🛡️ Helper: Convert raw UI calendar data cleanly into ISO strings for .NET mapping
   */
  private formatDate(date: any): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  private isDateRangeValid(): boolean {
    const fromDate = this.toLocalDate(this.filter.fromDate);
    const toDate = this.toLocalDate(this.filter.toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if ((this.filter.fromDate && !fromDate) || (this.filter.toDate && !toDate)) {
      this.snackBar.open('Enter valid From and To dates.', 'Close', { duration: 3000 });
      return false;
    }

    if ((fromDate && fromDate > today) || (toDate && toDate > today)) {
      this.snackBar.open('Future dates cannot be used in the history filters.', 'Close', { duration: 3000 });
      return false;
    }

    if (fromDate && toDate && fromDate > toDate) {
      this.snackBar.open('From Date must be on or before To Date.', 'Close', { duration: 3000 });
      return false;
    }

    return true;
  }

  private toLocalDate(value: Date | string | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }

    let date: Date;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    date.setHours(0, 0, 0, 0);
    return date;
  }
}
