import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-select-site-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatRadioModule,
    MatButtonModule
  ],
  templateUrl: './select-site-dialog.component.html',
  styleUrls: ['./select-site-dialog.component.scss']
})
export class SelectSiteDialogComponent {

  selectedSiteId!: number;
  siteSearchTerm = '';

  constructor(
    public dialogRef: MatDialogRef<SelectSiteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  get filteredSites(): any[] {
    const query = this.siteSearchTerm.trim().toLowerCase();
    const sites = this.data?.sites ?? [];

    return query
      ? sites.filter((site: any) => site.siteName?.toLowerCase().includes(query))
      : sites;
  }

  onContinue(): void {

    if (!this.selectedSiteId) {
      return;
    }

    this.dialogRef.close(this.selectedSiteId);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}