import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../shared/material.collection';
import { TicketService } from '../../core/services/ticket.service';
import { UserService } from '../../core/services/user.service'; 
import { TicketHistoryDto } from '../../core/models/tickethistory.model';
import { provideNativeDateAdapter } from '@angular/material/core';

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

  filter = {
    ticketId: 0,
    fromDate: undefined as Date | string | undefined,
    toDate: undefined as Date | string | undefined,
    actionByUserId: undefined as number | undefined, 
    pageNumber: 1,
    pageSize: 10
  };

  constructor(
    private ticketService: TicketService, 
    private userService: UserService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Initialize Ticket ID from Parent if available
    if (this.ticketId) {
      this.filter.ticketId = this.ticketId;
    }
    
    // 2. Load users for the filter dropdown
    this.loadUsersLookup();

    // 3. Initial load of history
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
      ticketId: this.ticketId || 0, 
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
}
