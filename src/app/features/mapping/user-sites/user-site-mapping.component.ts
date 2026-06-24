import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation } from "@angular/core";
import { UserSiteService } from "../../../core/services/user-site.service";
import { UserService } from "../../../core/services/user.service";
import { MasterSiteService } from "../../../core/services/mastersite.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CommonModule } from "@angular/common";
import { MaterialModules } from "../../../shared/material.collection";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-site-usersite-mapping',
  standalone: true,
  imports: [CommonModule, MaterialModules, FormsModule],
  templateUrl: './user-site-mapping.component.html',
  styleUrls: ['./user-site-mapping.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserSiteMappingComponent implements OnInit {
  assignedUsers: any[] = []; 
  sites: any[] = [];
  availableUsers: any[] = [];
  
  selectedSiteId: number | null = null;
  selectedUserIds: number[] = [];
  isLoading = false;

  // ⚡ Pagination State Tracking for the Data Grid
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;

  displayedColumns: string[] = ['userName', 'hospitalName', 'isActive', 'actions'];

  constructor(
    private userSiteService: UserSiteService,
    private userService: UserService,
    private masterSiteService: MasterSiteService, 
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    // 🟢 Fix 1: Wrap initial loads in setTimeout to avoid the ExpressionChanged error
    setTimeout(() => {
      this.loadSites();
      this.loadAllAvailableUsers();
    });
  }

  loadSites(): void {
    this.masterSiteService.getSites({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (res) => {
        // 🟢 Fix 2: Wrap state updates in setTimeout for stability
        setTimeout(() => {
          this.sites = res.data || [];
          this.cdr.detectChanges(); 
        });
      },
      error: () => this.showSnackBar('Failed to load sites')
    });
  }

  loadAllAvailableUsers(): void {
    this.isLoading = true;
    this.availableUsers = []; // Clear previous selection pools
    this.fetchUserPage(1);
  }

  private fetchUserPage(pageNumber: number): void {
    this.userService.getUsers({ pageNumber, pageSize: 50 }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
         const filteredUsers = (res.data || []).filter((user: any) =>
  ![
    'superadmin',
    'supportengineer',
    'manager',
    'systemuser'
  ].includes(
    user.roleName?.replace(/\s/g, '').toLowerCase()
  )
);

this.availableUsers = [...this.availableUsers, ...filteredUsers];
          if (res.pageNumber < res.totalPages) {
            this.fetchUserPage(pageNumber + 1);
          } else {
            this.isLoading = false;
          }
          this.cdr.detectChanges(); 
        });
      },
      error: () => { 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
      }
    });
  }

  onSiteChange(): void {
    if (this.selectedSiteId) {
      // 🟢 Fix 3: Clear the table immediately when changing sites
      this.assignedUsers = []; 
      this.currentPage = 1; // Reset to page 1 on site change
      this.loadMappings();
    }
  }

  // =========================================================================
  // HANDLES THE PAGINATED RES ENVELOPE STRUCTURAL OBJECT
  // Pass current page indices down into your Angular UserSiteService
  // =========================================================================
  loadMappings(): void {
    if (!this.selectedSiteId) return;
    
    this.userSiteService.getUsersBySite(this.selectedSiteId, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        // FIX: Wrap the data assignment inside a macro-task/setTimeout to prevent NG0100 timing errors
        setTimeout(() => {
          this.assignedUsers = res.data || [];
          this.totalRecords = res.totalRecords || 0;
          
          // This safely signals the engine that data layout boundaries have securely stabilized
          this.cdr.detectChanges();
        });
      },
      error: () => this.showSnackBar('Error loading assigned users')
    });
  }

  // ⚡ Handles page click change interaction events emitted from HTML
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1; // Material Paginator is 0-indexed, Backend is 1-indexed
    this.pageSize = event.pageSize;
    this.loadMappings();
  }

  onAssign(): void {
    if (!this.selectedSiteId || this.selectedUserIds.length === 0) return;

    const dto = { 
      MasterSiteId: this.selectedSiteId, 
      UserIds: this.selectedUserIds 
    };
    
    this.userSiteService.assignUsers(dto).subscribe({
      next: (response) => {
        this.showSnackBar(response || 'Users assigned successfully');
        // 🟢 Reset selection
        this.selectedUserIds = [];
        
        // ⚡ DATA SYNC FIX: Reload mapping data rows AND flush/re-cache available dropdown users list.
        // This ensures the dropdown options map directly to clean state rules immediately!
        this.loadMappings(); 
        this.loadAllAvailableUsers();
      },
      error: () => this.showSnackBar('Failed to assign users')
    });
  }

  updateStatus(user: any, shouldActivate: boolean): void {
    const siteId = Number(this.selectedSiteId);
    if (!siteId) return;

    const dto = { 
      userId: user.userId, 
      MasterSiteId: siteId 
    };
    
    const request$ = shouldActivate 
      ? this.userSiteService.activate(dto) 
      : this.userSiteService.deactivate(dto);

    request$.subscribe({
      next: () => {
        this.showSnackBar(`User ${shouldActivate ? 'activated' : 'deactivated'} successfully`);
        
        // ⚡ YOUR BUSINESS RULE AT ONE GO: Because the backend updates both data tables together,
        // reloading mappings here instantly syncs the display states on the client layout view.
        this.loadMappings(); 
      },
      error: () => this.showSnackBar('Error updating status')
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
