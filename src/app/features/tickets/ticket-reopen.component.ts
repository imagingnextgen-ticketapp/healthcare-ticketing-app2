import { Component, OnInit, Inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { TicketService } from '../../core/services/ticket.service';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  selector: 'app-ticket-reopen-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, ...MaterialModules, ReactiveFormsModule, MatDialogModule],
  templateUrl: './ticket-reopen.component.html'
})
export class TicketReopenComponent implements OnInit {
  reopenForm!: FormGroup;
  loading = true; // Start as true while loading context

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef, // Added CDR
    public dialogRef: MatDialogRef<TicketReopenComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: number }
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    if (this.data.ticketId) {
      this.loadTicketContext();
    } else {
      this.loading = false;
    }
  }

  initForm(): void {
    this.reopenForm = this.fb.group({
      masterSiteName: [{ value: '', disabled: true }], 
      productName: [{ value: '', disabled: true }],    
      description: [{ value: '', disabled: true }],
      comment: ['', [Validators.required, Validators.minLength(5)]] 
    });
  }

  loadTicketContext(): void {
    // Calling your worklist service to get specific ticket details for the header
    this.ticketService.getWorklist({ ticketId: this.data.ticketId })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges(); // Force UI update after async data loads
        })
      )
      .subscribe({
        next: (res: any) => {
          const ticket = res.data[0]; 
          if (ticket) {
            this.reopenForm.patchValue({
              masterSiteName: ticket.siteName || 'N/A',
              productName: ticket.productName || 'N/A',
              description: ticket.description
            });
            this.cdr.markForCheck(); // Ensure the form reflects the patched values
          }
        },
        error: () => {
          this.snackBar.open('Failed to load ticket context', 'Close');
          this.dialogRef.close();
        }
      });
  }

onSubmit(): void {
  if (this.reopenForm.valid) {
    this.loading = true;
    // 🟢 FIXED: Changed 'Comment' to 'comment' to match your initForm()
    const commentValue = this.reopenForm.get('comment')?.value;

    this.ticketService.reopenTicket(this.data.ticketId, commentValue).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Ticket Reopened', 'Success', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open('Reopen Failed', 'Close');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
}
