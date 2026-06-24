 import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TicketService } from '../../core/services/ticket.service';
import { MaterialModules } from '../../shared/material.collection';
// Adjust this import path to match your app structure

@Component({
  selector: 'app-ticket-close-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule,MaterialModules],
  template: `
    <div class="fuji-dialog p-4">
      <h2 mat-dialog-title class="mb-0 border-bottom pb-2" style="color: #008a4c; font-weight: 600;">
        Close Ticket #{{data.ticketId}}
      </h2>
      
      <form [formGroup]="closeForm" (ngSubmit)="submitClose()">
        <mat-dialog-content class="pt-3">
          <p class="text-muted small">
            Please specify the technical resolution remarks or solution comments to formally close this support case.
          </p>
          
          <mat-form-field appearance="outline" class="w-100 mt-2">
            <mat-label>Solution Comment / Resolution Remarks</mat-label>
            <textarea 
              matInput 
              formControlName="solutionComment" 
              rows="4" 
              placeholder="Provide clear steps taken to resolve this problem..."
              autofocus>
            </textarea>
            <mat-error *ngIf="closeForm.get('solutionComment')?.hasError('required')">
              Resolution remarks are strictly required to close a ticket.
            </mat-error>
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="pt-2">
          <button type="button" mat-button mat-dialog-close [disabled]="loading">Cancel</button>
          <button type="submit" mat-flat-button color="warn" [disabled]="closeForm.invalid || loading">
            {{ loading ? 'Closing Case...' : 'Confirm Closure' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `
})
export class TicketCloseDialogComponent implements OnInit {
  closeForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TicketCloseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.closeForm = this.fb.group({
      solutionComment: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  submitClose(): void {
    if (this.closeForm.invalid || this.loading) return;
    this.loading = true;

    const dto = {
      ticketId: this.data.ticketId,
      status: 4, // 4 = Status Closed enum mapping
      comment: this.closeForm.value.solutionComment
    };

    this.ticketService.updateStatus(dto).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Ticket closed successfully.', 'OK', { duration: 3000 });
        this.dialogRef.close(true); // Triggers list refresh automatically
      },
      error: (err) => {
        this.loading = false;
        console.error('Ticket closure execution failed:', err);
        const errMsg = err.error?.message || 'Failed to update closure state.';
        this.snackBar.open(errMsg, 'Close', { duration: 4000 });
      }
    });
  }
}
