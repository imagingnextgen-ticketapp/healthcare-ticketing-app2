import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  selector: 'app-solution-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule,MaterialModules],
  template: `
    <div class="fuji-dialog p-4">
      <!-- HEADER -->
      <div class="d-flex align-items: center; gap: 8px; border-bottom pb-2 mb-3">
        <mat-icon style="color: #008a4c;">assignment_turned_in</mat-icon>
        <h2 mat-dialog-title class="mb-0" style="color: #008a4c; font-weight: 600; font-size: 1.2rem;">
          Resolution Details — Ticket #{{data.ticketId}}
        </h2>
      </div>
      
      <!-- CONTENT LAYER -->
      <mat-dialog-content class="pb-2">
        
        <!-- METADATA SUB-TEXT -->
        <div class="mb-3 p-2 rounded" style="background-color: #f8fafc; border: 1px solid #f1f5f9; font-size: 0.8rem; color: #64748b;">
          <div>Resolved By: <strong class="text-slate-800" style="color: #008a4c;">{{ data.resolvedBy || 'Support Center Specialist' }}</strong></div>
        </div>

        <!-- REMARKS DISPLAY BLOCK -->
        <div style="font-weight: 500; font-size: 0.85rem; color: #008a4c; margin-bottom: 6px;">Technical Solution Comment:</div>
        <div class="p-3 rounded" style="background-color: #fdfdfd; border: 1px solid #e2e8f0; font-size: 0.88rem; line-height: 1.5; color: #1e293b; white-space: pre-wrap; min-height: 80px;">
          {{ data.solution || 'No resolution message was cataloged for this closure.' }}
        </div>

      </mat-dialog-content>

     <!-- FOOTER CLOSE BUTTON -->
<mat-dialog-actions align="end" class="pt-2">
  <!-- 🟢 FIXED: Removed color="primary" and applied your premium brand green background color -->
  <button type="button" 
          mat-flat-button 
          mat-dialog-close 
          style="min-width: 80px; background-color: #008a4c !important; color: #ffffff !important; font-weight: 600; border-radius: 4px;">
    OK
  </button>
</mat-dialog-actions>

  `
})
export class SolutionViewDialogComponent {
  // Pure visualization modal wrapper requires zero state logic
  constructor(
    public dialogRef: MatDialogRef<SolutionViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
