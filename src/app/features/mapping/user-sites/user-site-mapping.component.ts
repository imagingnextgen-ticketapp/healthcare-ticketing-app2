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
    this.loadSites();
    this.loadAllAvailableUsers();
  }

  loadSites(): void {
    this.masterSiteService.getSites({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (res) => {
        // Filter active sites natively
        this.sites = (res.data || []).filter((site: any) => site.isActive);
        this.cdr.detectChanges();
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
        const filteredUsers = (res.data || []).filter((user: any) =>
          ![
            'superadmin',
            'supportengineer',
            'manager',
            'systemuser'
          ].includes(user.roleName?.replace(/\s/g, '').toLowerCase())
        );

        this.availableUsers = [...this.availableUsers, ...filteredUsers];
        
        if (res.pageNumber < res.totalPages) {
          this.fetchUserPage(pageNumber + 1);
        } else {
          this.isLoading = false;
          this.cdr.detectChanges(); 
        }
      },
      error: () => { 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
      }
    });
  }

  onSiteChange(): void {
    if (this.selectedSiteId) {
      this.assignedUsers = []; 
      this.currentPage = 1; // Reset to page 1 on site change
      this.loadMappings();
    }
  }

  loadMappings(): void {
    if (!this.selectedSiteId) return;
    
    this.userSiteService.getUsersBySite(this.selectedSiteId, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.assignedUsers = res.data || [];
        this.totalRecords = res.totalRecords || 0;
        this.cdr.detectChanges();
      },
      error: () => this.showSnackBar('Error loading assigned users')
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1; 
    this.pageSize = event.pageSize;
    this.loadMappings();
  }

  onAssign(): void {
    if (!this.selectedSiteId || this.selectedUserIds.length === 0) return;

    const dto = {
      masterSiteId: this.selectedSiteId,
      userIds: this.selectedUserIds
    };

    this.userSiteService.assignUsers(dto).subscribe({
      next: (response: any) => {
        const message = typeof response === 'string'
          ? response
          : response?.message || 'Users processed successfully';

        this.showSnackBar(message);

        // 🟢 THE FIX: Defer resetting the model arrays to the next macro-task.
        // This lets the Material dropdown finish its active closure cycle before data arrays reset.
        setTimeout(() => {
          this.selectedUserIds = [];
          this.loadMappings();
          this.loadAllAvailableUsers();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        let message = 'Failed to process users';
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
      }
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
        this.loadMappings(); 
      },
      error: () => this.showSnackBar('Error updating status')
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
