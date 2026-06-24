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
    fromDate: undefined,
    toDate: undefined,
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
    // FIX: Allow the call if there is a TicketId OR a User selected OR a Date range
    const hasTicketId = this.filter.ticketId > 0;
    const hasUser = this.filter.actionByUserId !== undefined && this.filter.actionByUserId !== null && this.filter.actionByUserId !== 0;
    const hasDate = !!this.filter.fromDate;

    // Only stop if absolutely NO filters are applied
    if (!hasTicketId && !hasUser && !hasDate) {
      this.historyLogs = [];
      this.totalRecords = 0;
      return;
    }

    this.isLoading = true;
    this.ticketService.getTicketHistory(this.filter).subscribe({
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
        this.cdr.detectChanges();
      }
    });
  }
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
    // Reset to first page for new search
    this.filter.pageNumber = 1;
    
    // Clean up "All Users" selection if it defaults to 0
    if (this.filter.actionByUserId === 0) {
      this.filter.actionByUserId = undefined;
    }

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
}
