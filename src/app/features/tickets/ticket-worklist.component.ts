import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subscription, Observable, startWith, map } from 'rxjs';

import { TicketService } from '../../core/services/ticket.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { TicketStatus } from '../../core/models/ticket-status.enum';
import { MaterialModules } from '../../shared/material.collection';
import { TicketReopenComponent } from './ticket-reopen.component';
import { TicketAttachmentService } from '../../core/services/ticket-attachment.service';
import { TicketCreateComponent } from './ticket-create.component';
import { TicketCloseDialogComponent } from './ticket-close.component';
import { SolutionViewDialogComponent } from './solution-view.dialog.component';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { TicketResponseDto } from '../../core/models/ticket.model';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
@Component({
  selector: 'app-assign-ticket-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,MaterialModules, MatDialogModule,], // Add your MaterialModules shared array here
  template: `
    <div class="fuji-dialog p-3">
      <h2 mat-dialog-title class="mb-0" style="color: #517062;">Assign Ticket #{{data.ticketId}}</h2>
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="w-100 mt-3">
          <mat-label>Search Engineer</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Start typing name..." autofocus>
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-nav-list class="engineer-list mt-2">
          <mat-list-item *ngFor="let eng of filteredEngineers$ | async" (click)="select(eng)" class="eng-item">
            <mat-icon matListItemIcon color="primary">person</mat-icon>
            <div matListItemTitle class="fw-bold">{{eng.userName}}</div>
            <div matListItemLine>{{eng.role || 'Service Engineer'}}</div>
          </mat-list-item>
        </mat-nav-list>
      </mat-dialog-content>
      <mat-dialog-actions align="end"><button mat-button mat-dialog-close>Cancel</button></mat-dialog-actions>
    </div>
  `,
  styles: [`.engineer-list { max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px; } .eng-item:hover { background-color: #f5f5f5; cursor: pointer; }`]
})
export class AssignTicketDialog {
  searchControl = new FormControl('');
  filteredEngineers$: Observable<any[]>;
  constructor(public dialogRef: MatDialogRef<AssignTicketDialog>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.filteredEngineers$ = this.searchControl.valueChanges.pipe(
      startWith(''), 
      map(val => data.engineers.filter((e:any) => e.userName?.toLowerCase().includes(val?.toLowerCase() || '')))
    );
  }
  select(engineer: any) { this.dialogRef.close(engineer); }
}

@Component({
  selector: 'app-ticket-worklist',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule,
    MaterialModules
  ], // Add your MaterialModules shared array here
  templateUrl: './ticket-worklist.component.html',
  styleUrls: ['./ticket-worklist.component.scss']
})
export class TicketWorklistComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  displayedColumns: string[] = ['ticketId', 'issueType', 'description', 'createdDate', 'productName', 'siteName', 'reOpenCount', 'createdBy', 'assignedTo', 'status', 'closedDate', 'tatHours', 'severity', 'actualTatHours', 'actions'];
  
  dataSource = new MatTableDataSource<any>([]);
  pageSizeOptions = [10, 25, 50, 100];
  readonly StatusEnum = TicketStatus;
  loading = false;
  currentUser: any;
  filterForm!: FormGroup;
  filterSubscription: Subscription | null | undefined;
   // 2. ADD COMPONENT PROPERTIES FOR THE RESPONSIVE DATEPICKER
  maxDate = new Date();
  //isMobile$: Observable<boolean>;
  totalRecords = 0; pageSize = 10; pageNumber = 1; currentTabIndex = 0; allEngineers: any[] = [];

  readonly ROLES = { SUPER_ADMIN: 'SuperAdmin', SUPPORT_ENGINEER: 'SupportEngineer', HOSPITAL_ADMIN: 'HospitalAdmin', HOSPITAL_USER: 'HospitalUser' };
  statusOptions = [{label: 'Open', value: 1}, {label: 'Assigned', value: 2}, {label: 'InProgress', value: 3}, {label: 'Closed', value: 4}, {label: 'Reopened', value: 5}];

  constructor(
    private fb: FormBuilder, 
    private ticketService: TicketService, 
    private userService: UserService,
    private attachmentService: TicketAttachmentService, 
    private auth: AuthService, 
    private dialog: MatDialog, 
    private cdr: ChangeDetectorRef, 
    private snackBar: MatSnackBar,
    //private breakpointObserver: BreakpointObserver
  ) {
  /*  this.isMobile$ = this.breakpointObserver
    .observe([Breakpoints.Handset]) 
    .pipe(
      map((result: any) => result.matches),
      distinctUntilChanged() // Prevents unnecessary layout redraws
    ); */

  }

  ngOnInit(): void {
    this.currentUser = this.auth.getUser();
    this.initFilterForm();
    this.setupAutoSearch();
    this.loadEngineers();
   this.refresh();
  }

  ngAfterViewInit() { this.dataSource.paginator = this.paginator; }
  ngOnDestroy() { this.filterSubscription?.unsubscribe(); }

  initFilterForm() { this.filterForm = this.fb.group({ ticketId: [null], status: [null], createdDate: [null], resolveDate: [null] }); }

  setupAutoSearch() { 
    this.filterSubscription = this.filterForm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => { this.pageNumber = 1; this.refresh(); }); 
  }

  loadEngineers() { this.userService.getEngineers().subscribe(users => this.allEngineers = users || []); }

  refresh(isManual: boolean = false) {
  // 🟢 1. AUTO-LOAD TOGGLE: Turn on the spinner and disable the button instantly
  this.loading = true;
  this.cdr.detectChanges(); // Sync template layout states immediately

  const formValues = { ...this.filterForm.value };

  if (this.currentTabIndex === 1) {
    formValues.assignedToUserId = this.currentUser.userId;
  }

  if (formValues.createdDate) {
    const d = new Date(formValues.createdDate);
    formValues.createdDate = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  
  if (formValues.resolveDate) {
    const d = new Date(formValues.resolveDate);
    formValues.resolveDate = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  const params = { pageNumber: this.pageNumber, pageSize: this.pageSize, ...formValues };

  this.ticketService.getWorklist(params).subscribe({
    next: (res: any) => {
      this.dataSource.data = res.data || [];
      this.totalRecords = res.totalRecords || 0;

      // Introduce a brief 200ms visual buffer so the reload animation is clearly visible
      setTimeout(() => {
        // 🟢 2. AUTO-LOAD RELEASE: Turn off loading since data successfully arrived
        this.loading = false; 
        this.cdr.detectChanges();
        
        // Show success alert only on manual button interaction clicks
        if (isManual) {
          this.snackBar.open('Worklist layout synchronized successfully.', 'Dismiss', { 
            duration: 2000
          });
        }
      }, 200);
    },
    error: (err) => {
      console.error('Error fetching worklist:', err);
      this.snackBar.open('Failed to load tickets', 'Close', { duration: 3000 });
      
      // 🟢 3. SAFETY RELEASE: Turn off loading so the button unlocks if the backend fails
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}



  resetFilters(): void {
    this.filterForm.reset();
    this.pageNumber = 1;
    this.refresh();
  }
   // =====================================================
  // 🟢 FIXED LOOKUP HELPER (Handles Numbers and Strings)
  // =====================================================
  getStatusLabel(statusValue: any): string {
    if (statusValue === null || statusValue === undefined) return 'Unknown';

    // Normalize input to a clean, lowercase string to avoid casing mismatches
    const input = String(statusValue).trim().toLowerCase();

    // 🗺️ EXPLICIT STRING AND INDEX DICTIONARY MAP
    const statusMap: { [key: string]: string } = {
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

    return statusMap[input] || `Unknown (${statusValue})`;
  }


onTabChange(index: number) {
  // 1. Instantly kill the auto-search stream so old elements don't fire background events
  if (this.filterSubscription) {
    this.filterSubscription.unsubscribe();
    this.filterSubscription = undefined;
  }

  // 2. Set memory properties immediately
  this.currentTabIndex = index;
  this.pageNumber = 1;

  // 3. Force Angular to swap the active tab view panel in the DOM first
  this.cdr.detectChanges();

  // 4. 🟢 THE PERMANENT ARCHITECTURAL FIX: Use a double-frame delay (setTimeout).
  // This completely yields execution until Angular finishes rendering the template,
  // remounting the input fields, and binding the table controls securely.
  setTimeout(() => {
    
    // 5. Clear the freshly mounted form controls safely without side-effects
    if (this.filterForm) {
      this.filterForm.patchValue(
        { ticketId: null, status: null, createdDate: null, resolveDate: null },
        { emitEvent: false }
      );
    }

    this.cdr.detectChanges();

    // 6. Automatically fetch the data. The newly rendered table is now ready to receive it!
    this.refresh();

    // 7. Re-initialize the typing watcher cleanly on the new input element instance
    this.setupAutoSearch();
    
  }, 50); // A clean 50ms window guarantees DOM layout settlement
}


// =====================================================
  // --- CORE WORKFLOW DE-CLUTTER ACTION ACTIONS HUB ---
  // =====================================================
  openEditTicketDialog(ticket: any): void {
    const dialogRef = this.dialog.open(TicketCreateComponent, {
      width: '750px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'fuji-edit-dialog-panel',
      data: { ticketId: ticket.ticketId }
    });

    dialogRef.afterClosed().subscribe((hasChangesSaved: boolean) => {
      if (hasChangesSaved) {
        this.refresh();
      }
    });
  }

openCloseTicketDialog(ticket: TicketResponseDto): void {
  const dialogRef = this.dialog.open(TicketCloseDialogComponent, {
    width: '550px',
    disableClose: true,
    panelClass: 'fuji-close-dialog-panel',
    data: { ticketId: ticket.ticketId }
  });

  dialogRef.afterClosed().subscribe((result: any) => {
    // If your closure dialogue returns an object or true on success
    if (result) {
      // 🟢 Force instant UI alignment matching your type contracts
      ticket.status = 4;
      
      // Handle both boolean true fallbacks or direct string mappings safely
      if (result.solutionComment) {
        ticket.resolutionNotes = result.solutionComment;
      }
      
      this.refresh();
    }
  });
}

openSolutionViewDialog(ticket: TicketResponseDto): void {
  this.dialog.open(SolutionViewDialogComponent, {
    width: '500px',
    maxWidth: '90vw',
    panelClass: 'fuji-solution-panel',
    data: { 
      ticketId: ticket.ticketId,
      // 🟢 FIX: Map directly to the contract field verified in your model file
      solution: ticket.resolutionNotes || '',
      resolvedBy: ticket.assignedTo || 'Support Engineer'
    }
  });
}

/**
 * Alias method to resolve template bindings safely 
 */
viewResolutionNotes(ticket: TicketResponseDto): void {
  this.openSolutionViewDialog(ticket);
}




  handleAction(ticket: any, action: string) {
    const nextStatus = action === 'start' ? 3 : 4;
    const dto = { ticketId: ticket.ticketId, status: nextStatus, comment: action === 'start' ? "Work Started" : "Ticket Closed" };
    this.ticketService.updateStatus(dto).subscribe(() => this.refresh());
  }

  openAssignPopup(ticket: any) {
    const dialogRef = this.dialog.open(AssignTicketDialog, { 
      width: '450px', 
      data: { ticketId: ticket.ticketId, engineers: this.allEngineers } 
    });

    dialogRef.afterClosed().subscribe(selectedEng => { 
      if (selectedEng) this.assignTicket(ticket.ticketId, selectedEng); 
    });
  }

  assignTicket(ticketId: number, engineer: any) {
    this.ticketService.assignTicket(ticketId, engineer.userId).subscribe({
      next: () => {
        this.snackBar.open(`Ticket successfully assigned to ${engineer.userName}`, 'Close', { duration: 2000 });
        this.refresh(); 
      },
      error: (err) => {
        console.error('Assignment failed', err);
        this.snackBar.open('Assignment failed. Check permissions.', 'Close', { duration: 3000 });
      }
    });
  }

  openReopenDialog(ticket: any) {
    const dialogRef = this.dialog.open(TicketReopenComponent, {
      width: '650px', 
      panelClass: 'reopen-dialog-panel',
      data: { ticketId: ticket.ticketId },
    });
    dialogRef.afterClosed().subscribe(res => { if (res) this.refresh(); });
  }

    // --- ON-DEMAND ATTACHMENT HUB LOGIC BLOCK ---
  activeTicketFiles: any[] = [];
  isLoadingAttachments = false;
  menuTicketFilesMap: { [ticketId: number]: any[] } = {};
  isMenuLoadingMap: { [ticketId: number]: boolean } = {};
  // --- FIXED FILE RETRIEVAL METRICS STREAM ---
  loadTicketAttachments(ticketId: number): void {
    if (!ticketId) return;
    
    // 1. Maintain global state variables for your other 3 features
    this.isLoadingAttachments = true;
    this.activeTicketFiles = [];

    // 2. Clear state and start loading for this specific row item
    this.isMenuLoadingMap[ticketId] = true;
    this.menuTicketFilesMap[ticketId] = [];
    this.cdr.detectChanges();

    this.attachmentService.getAttachmentsByTicket(ticketId).subscribe({
      next: (files: any[]) => {
        const processedFiles = files || [];

        // Update legacy variables for the rest of your app
        this.activeTicketFiles = processedFiles;
        this.isLoadingAttachments = false;

        // Update row-isolated variables for the popup menu
        this.menuTicketFilesMap[ticketId] = processedFiles;
        this.isMenuLoadingMap[ticketId] = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load attachments:', err);
        // Reset legacy variables
        this.isLoadingAttachments = false;

        // Reset row-isolated variables
        this.isMenuLoadingMap[ticketId] = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewFileBinary(attachmentId: number): void {
    this.attachmentService.downloadAttachment(attachmentId).subscribe({
      next: (blob: Blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        window.open(fileUrl, '_blank');
      },
      error: (err) => {
        console.error('File preview failed:', err);
        this.snackBar.open('Unable to preview attachment', 'Close', { duration: 3000 });
      }
    });
  }

  downloadFileBinary(attachmentId: number, fileName: string): void {
    this.attachmentService.downloadAttachment(attachmentId).subscribe({
      next: (blob: Blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const linkAnchor = document.createElement('a');
        linkAnchor.href = fileUrl;
        
        // 🟢 FIXED: Wrapped template literal string securely in backticks
        linkAnchor.download = fileName || `Attachment_${attachmentId}`;
        
        document.body.appendChild(linkAnchor);
        linkAnchor.click();
        
        document.body.removeChild(linkAnchor);
        window.URL.revokeObjectURL(fileUrl);
      },
      error: (err) => {
        console.error('Download failed:', err);
        this.snackBar.open('Unable to download attachment', 'Close', { duration: 3000 });
      }
    });
  }

   canEditTicket(ticket: any): boolean {
  if (!ticket || !this.currentUser) {
    return false;
  }

  const rawRole =
    this.currentUser.roleName ||
    this.currentUser.RoleName ||
    this.currentUser.role ||
    '';

  const userRole =
    String(rawRole).trim().toLowerCase();

  const currentUserId =
    this.currentUser.userId ||
    this.currentUser.UserId;

  const createdByUserId =
    ticket.createdByUserId ||
    ticket.CreatedByUserId;

  const assignedToUserId =
    ticket.assignedToUserId ||
    ticket.AssignedToUserId;

  const rawStatus =
    String(ticket.status || ticket.Status || '')
      .trim()
      .toLowerCase();

  // Open, Assigned, Reopened only
  const isEditableStatus =
    rawStatus === 'open' ||
    rawStatus === 'assigned' ||
    rawStatus === 'reopened' ||
    rawStatus === '1' ||
    rawStatus === '2' ||
    rawStatus === '5' ||
    ticket.status === 1 ||
    ticket.status === 2 ||
    ticket.status === 5;

  if (!isEditableStatus) {
    return false;
  }

  // SuperAdmin
  if (
    userRole === 'superadmin' ||
    userRole === 'super admin'
  ) {
    return true;
  }

  // HospitalAdmin
  if (
    userRole === 'hospitaladmin' ||
    userRole === 'hospital admin'
  ) {
    return true;
  }

  // HospitalUser
  if (
    userRole === 'hospitaluser' ||
    userRole === 'hospital user'
  ) {
    return String(currentUserId) === String(createdByUserId);
  }

  // SupportEngineer
  if (
    userRole === 'supportengineer' ||
    userRole === 'support engineer'
  ) {
    const isCreator =
      String(currentUserId) === String(createdByUserId);

    const isAssigned =
      String(currentUserId) === String(assignedToUserId);

    return isCreator || isAssigned;
  }

  return false;
}
private getNormalizedStatus(ticket: any): number {
  const status = String(ticket?.status ?? '')
    .trim()
    .toLowerCase();

  switch (status) {
    case '1':
    case 'open':
      return 1;

    case '2':
    case 'assigned':
      return 2;

    case '3':
    case 'inprogress':
    case 'in progress':
      return 3;

    case '4':
    case 'closed':
      return 4;

    case '5':
    case 'reopened':
      return 5;

    default:
      return Number(ticket?.status) || 0;
  }
}


// --- GUARDS ---
  canAssign(ticket: any): boolean {
  if (!ticket || !this.currentUser) {
    return false;
  }

  const status = this.getNormalizedStatus(ticket);

  // Never allow assignment on closed tickets
  if (status === 4 || ticket.closedDate) {
    return false;
  }

  const isSuperAdmin =
    this.currentUser.role === this.ROLES.SUPER_ADMIN;

  const isSupportEng =
    this.currentUser.role === this.ROLES.SUPPORT_ENGINEER;

  const isAssignedToMe =
    Number(ticket.assignedToUserId) === Number(this.currentUser.userId);

  if (isSuperAdmin) {
    return true;
  }

  if (isSupportEng) {
    return !isAssignedToMe;
  }

  return false;
}

/// 🛠️ START WORK: Shows only for status 2 (Assigned/Open)


canStartWork(ticket: any): boolean {
  console.log(
  'Ticket:',
  ticket.ticketId,
  'Status:',
  ticket.status,
  'Type:',
  typeof ticket.status
);
  if (!ticket || !this.currentUser || !this.ROLES) return false;

  // Normalize status INSIDE same method (no helper)
  const rawStatus = ticket.status;
  const status =
    typeof rawStatus === 'string'
      ? (() => {
          const s = rawStatus.trim().toLowerCase();
          if (s === 'open') return 1;
          if (s === 'assigned') return 2;
          if (s === 'inprogress' || s === 'in progress') return 3;
          if (s === 'closed') return 4;
          if (s === 'reopened') return 5;
          return Number(rawStatus);
        })()
      : Number(rawStatus);

  // ❌ Block InProgress & Closed
  if (status === 3 || status === 4) return false;

  const isSuperAdmin = this.currentUser.role === this.ROLES.SUPER_ADMIN;
  const isSupportEng = this.currentUser.role === this.ROLES.SUPPORT_ENGINEER;

  const currentUserId = this.currentUser.userId || this.currentUser.UserId;
  const assignedUserId = ticket.assignedToUserId || ticket.AssignedToUserId;

  const isAssignedToMe =
    Number(currentUserId) === Number(assignedUserId);

  // 🟢 Super Admin: Open, Assigned, Reopened
  if (isSuperAdmin) {
    return status === 1 || status === 2 || status === 5;
  }

  // 🟡 Support Engineer: only if assigned to me
  if (isSupportEng) {
    return (status === 1 || status === 2 || status === 5) && isAssignedToMe;
  }

  return false;
}

// 🔒 2. CLOSE TICKET BUTTON (Direct Inline Icon Button)
// Shows directly in the row cells whenever a ticket status transitions to 3 (In Progress)
// 🔒 CLOSE TICKET: Only visible when a case is actively "In Progress" or Status 3

canClose(ticket: any): boolean {
  // 1. Guard clause: Ensure ticket, user details, and roles object exist
  if (!ticket || !this.currentUser || !this.ROLES) return false;

  // 2. Identify the user's role using your global role constants matrix
  const isHospitalAdmin = this.currentUser.role === this.ROLES.HOSPITAL_ADMIN;
  const isHospitalUser  = this.currentUser.role === this.ROLES.HOSPITAL_USER;
  const isSuperAdmin    = this.currentUser.role === this.ROLES.SUPER_ADMIN;
  const isSupportEng    = this.currentUser.role === this.ROLES.SUPPORT_ENGINEER;
  // 3. Status checks mapped directly to your TicketStatus Enum parameters
  const isClosed = ticket.status === 4 || ticket.status === 'Closed';
  const isInProgress = ticket.status === 3 || 
                       ticket.status === 'InProgress' || 
                       String(ticket.status).trim().toLowerCase() === 'in progress';

  // 4. Role Rule for HospitalAdmin & HospitalUser:
  // Always allowed to close a ticket, UNLESS it is already closed (Status 4)
  if (isHospitalAdmin || isHospitalUser) {
    return !isClosed;
  }

  // 5. Role Rule for SuperAdmin & Support Engineer:
  // They can ONLY close the ticket if the status is strictly InProgress (Status 3)
  if (isSuperAdmin || isSupportEng) {
    return isInProgress;
  }

  // 6. Secure Fallback: Deny permission to any unmapped role types
  return false;
}

// 🔓 REOPEN TICKET: Common for every user role, strictly dependent on "Closed" status
canReopen(ticket: any): boolean {
  if (!ticket) return false;

  // Track both number and string variations coming from the backend data grid rows
  const isClosed = ticket.status === 4 || 
                   ticket.status === '4' || 
                   String(ticket.status).trim().toLowerCase() === 'closed';

  // 🟢 FIX: Removed the role-based guard clause so it is exposed to all users
  return isClosed;
}




  onPageChange(event: any) { 
    this.pageSize = event.pageSize; 
    this.pageNumber = event.pageIndex + 1; 
    this.refresh(); 
  }
  

  /**
   * 🟢 MANUAL WORKLIST REFRESH METHOD
   */
  //  refreshManually(): void {
  //   if (this.loading) return; 

  //   this.loading = true;
  //   this.cdr.detectChanges(); 

  //   // Execute your data fetch
  //   this.refresh();

  //   // 🟢 FIX: Automatically release the loading state once the refresh stream initializes
  //   setTimeout(() => {
  //     this.loading = false;
  //     this.cdr.detectChanges();
  //   }, 1000); // Turns back to green after 1 second

  //   this.snackBar.open('Worklist layout synchronized successfully.', 'Dismiss', { 
  //     duration: 2500
  //   });
  // }


} // 🛑 THIS MUST BE THE ABSOLUTE LAST CHARACTER IN YOUR FILE




