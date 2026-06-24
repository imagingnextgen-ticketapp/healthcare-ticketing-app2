import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UserSiteDetailDto } from '../../core/models/user.model';

@Component({
  selector: 'app-user-sites-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="fuji-dialog">
      <div class="dialog-header">
        <div class="header-content">
          <mat-icon>business</mat-icon>
          <div class="text-group">
            <h3>{{ data.userName }}</h3>
            <p>Assigned Site Details</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn"><mat-icon>close</mat-icon></button>
      </div>

      <div class="dialog-tabs">
        <div class="tab active">
          <mat-icon>groups</mat-icon>
          Team Members ({{ data.sites.length }})
        </div>
      </div>

      <div class="dialog-body">
        <table class="styled-table">
          <thead>
            <tr>
              <th>Site Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let site of data.sites">
              <td>{{ site.name }}</td>
              <td>
                <div class="status-indicator" [class.active]="site.isActive">
                  <span class="dot"></span>
                  {{ site.isActive ? 'Active' : 'Inactive' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    $fuji-green: #008744;
    .fuji-dialog { overflow: hidden; border-radius: 8px; }
    .dialog-header { background-color: $fuji-green; color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;
      .header-content { display: flex; align-items: center; gap: 12px; 
        .text-group { h3 { margin: 0; font-size: 18px; font-weight: 500; } p { margin: 0; font-size: 12px; opacity: 0.9; }}}
      .close-btn { color: white; }
    }
    .dialog-tabs { padding: 0 24px; border-bottom: 1px solid #eee; display: flex;
      .tab { padding: 12px 16px; display: flex; align-items: center; gap: 8px; color: #3f51b5; border-bottom: 2px solid #3f51b5; font-size: 13px; font-weight: 500; }
    }
    .dialog-body { padding: 24px; 
      .styled-table { width: 100%; border-collapse: collapse; 
        th { text-align: left; color: #666; font-size: 11px; text-transform: uppercase; padding: 12px; background: #fafafa; }
        td { padding: 16px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333; }
      }
    }
    .status-indicator { display: flex; align-items: center; gap: 8px; font-size: 13px;
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; }
      &.active { color: #333; .dot { background: #00e676; } }
    }
  `]
})
export class UserSitesDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { userName: string, sites: UserSiteDetailDto[] }) {}
}
