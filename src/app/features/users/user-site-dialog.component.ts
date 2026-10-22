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
          Assigned Hospitals ({{ data.sites.length }})
        </div>
      </div>

      <div class="dialog-body" role="region" aria-label="Assigned hospitals" tabindex="0">
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
    :host {
      display: block;
      width: 100%;
      max-height: 90vh;
      max-height: 90dvh;
      overflow: hidden;
      border-radius: 12px;
    }

    .fuji-dialog {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: 90vh;
      max-height: 90dvh;
      overflow: hidden;
      background: #fff;
      border-radius: 12px;
    }

    .dialog-header {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 24px;
      color: #fff;
      background: #008744;
    }

    .header-content {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 12px;
    }

    .text-group {
      min-width: 0;
    }

    .text-group h3 {
      overflow-wrap: anywhere;
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.35;
    }

    .text-group p {
      margin: 3px 0 0;
      font-size: 13px;
      opacity: 0.92;
    }

    .close-btn {
      flex: 0 0 auto;
      color: #fff;
    }

    .dialog-tabs {
      display: flex;
      flex: 0 0 auto;
      padding: 0 24px;
      border-bottom: 1px solid #e8ece9;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 13px 14px 11px;
      color: #087a48;
      border-bottom: 2px solid #087a48;
      font-size: 14px;
      font-weight: 600;
    }

    .dialog-body {
      min-height: 0;
      flex: 1 1 auto;
      padding: 18px 24px 24px;
      overflow: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    .styled-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .styled-table th {
      position: sticky;
      z-index: 1;
      top: 0;
      padding: 12px 16px;
      color: #59615d;
      background: #f6f8f7;
      font-size: 12px;
      font-weight: 700;
      text-align: left;
      text-transform: uppercase;
    }

    .styled-table th:first-child,
    .styled-table td:first-child {
      width: 75%;
    }

    .styled-table td {
      padding: 15px 16px;
      color: #303632;
      border-bottom: 1px solid #edf0ee;
      font-size: 14px;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      font-size: 14px;
    }

    .status-indicator .dot {
      width: 8px;
      height: 8px;
      flex: 0 0 auto;
      border-radius: 50%;
      background: #8a9290;
    }

    .status-indicator.active .dot {
      background: #00a86b;
    }

    @media (max-width: 600px) {
      :host,
      .fuji-dialog {
        max-height: 88vh;
        max-height: 88dvh;
      }

      .dialog-header {
        gap: 8px;
        padding: 14px 16px;
      }

      .text-group h3 {
        font-size: 16px;
      }

      .text-group p {
        font-size: 12px;
      }

      .dialog-tabs {
        padding: 0 12px;
      }

      .tab {
        padding: 12px 10px 10px;
        font-size: 13px;
      }

      .dialog-body {
        padding: 12px 12px 16px;
      }

      .styled-table th {
        padding: 10px 8px;
        font-size: 11px;
      }

      .styled-table th:first-child,
      .styled-table td:first-child {
        width: 65%;
      }

      .styled-table td {
        padding: 13px 8px;
        font-size: 13px;
      }

      .status-indicator {
        gap: 6px;
        font-size: 12px;
      }
    }
  `]
})
export class UserSitesDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { userName: string, sites: UserSiteDetailDto[] }) {}
}
