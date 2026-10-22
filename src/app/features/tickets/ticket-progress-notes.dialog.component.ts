
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { TicketService } from '../../core/services/ticket.service';
import { TicketProgressNoteDto } from '../../core/models/ticket.model';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  selector: 'app-ticket-progress-notes-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatExpansionModule, 
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MaterialModules
  ],
  template: `
    <div class="fuji-dialog">

      <h2 mat-dialog-title class="dialog-title">
        Progress Notes - Ticket #{{ data.ticketId }}
      </h2>

      <mat-dialog-content class="dialog-content">

        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="35"></mat-spinner>
          <span class="loading-text">Loading progress notes...</span>
        </div>

        <div *ngIf="!loading && errorMessage" class="error-container">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage }}</span>
        </div>

        <div *ngIf="!loading && !errorMessage && notes.length === 0" class="empty-container">
          <mat-icon class="empty-icon">notes</mat-icon>
          <div class="empty-title">No Progress Notes</div>
          <div class="empty-message">No progress notes have been added for this ticket yet.</div>
        </div>

        <div *ngIf="!loading && !errorMessage && notes.length > 0" class="progress-notes-container">
          <mat-accordion class="progress-notes-accordion">

            <mat-expansion-panel
              *ngFor="let note of notes; let i = index"
              class="progress-note-panel"
              [expanded]="i === 0">

              <mat-expansion-panel-header class="note-panel-header">
                <mat-panel-title class="note-panel-title">
                  <mat-icon class="user-icon">account_circle</mat-icon>

                  <div class="user-details">
                    <div class="note-user">{{ note.addedByName }}</div>
                    <div class="note-date">{{ formatDate(note.createdDate) }}</div>
                  </div>
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="note-text">{{ note.note }}</div>

            </mat-expansion-panel>

          </mat-accordion>
        </div>

      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button type="button" mat-button mat-dialog-close class="close-button">
          Close
        </button>
      </mat-dialog-actions>

    </div>
  `,
  styles: [`
    /* Root frame boundary layout */
    .fuji-dialog {
      width: 100%;
      max-width: 700px;
      max-height: 82vh; /* Sets a rigid barrier below viewable window limits */
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .dialog-title {
      margin: 0;
      padding: 0 0 12px 0;
      border-bottom: 1px solid #e0e6e3;
      color: #008a4c;
      font-weight: 600;
      font-size: 20px;
      line-height: 1.4;
      flex-shrink: 0; /* Prevents title from squeezing on small displays */
    }

    /* Core container structural scroll layer */
    .dialog-content {
      padding: 16px 4px 10px 4px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow-y: auto !important; /* Material content handler acts as primary scroll layer */
      flex-grow: 1; 
    }

    .loading-container {
      min-height: 180px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 12px;
    }

    .loading-text {
      color: #6b7280;
      font-size: 14px;
    }

    .error-container {
      min-height: 150px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      padding: 20px;
      color: #b42318;
      background: #fef3f2;
      border: 1px solid #fecdca;
      border-radius: 6px;
      text-align: center;
    }

    .error-container mat-icon {
      color: #b42318;
    }

    .empty-container {
      min-height: 220px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 30px 20px;
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
      color: #008a4c;
      margin-bottom: 12px;
    }

    .empty-title {
      color: #374151;
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .empty-message {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      max-width: 420px;
    }

    /* Inner accordion wrapper wrapper */
    .progress-notes-container {
      width: 100%;
      height: auto;
      max-height: 100%; 
      padding: 2px 6px 2px 2px;
      box-sizing: border-box;
    }

    .progress-notes-accordion {
      display: block;
    }

    .progress-note-panel {
      border: 1px solid #e0e6e3;
      border-left: 4px solid #008a4c;
      border-radius: 6px !important;
      margin-bottom: 10px;
      background: #ffffff;
      box-shadow: none !important;
      overflow: hidden;
    }

    .progress-note-panel:last-child {
      margin-bottom: 0;
    }

    .note-panel-header {
      min-height: 64px !important;
      padding: 0 16px !important;
    }

    .note-panel-title {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .user-icon {
      color: #008a4c;
      margin-right: 10px;
      flex-shrink: 0;
    }

    .user-details {
      min-width: 0;
    }

    .note-user {
      color: #008a4c;
      font-weight: 600;
      font-size: 14px;
      line-height: 1.4;
      word-break: break-word;
    }

    .note-date {
      color: #777777;
      font-size: 12px;
      margin-top: 2px;
      line-height: 1.4;
    }

    .note-text {
      padding: 4px 16px 16px 16px;
      color: #333333;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .dialog-actions {
      padding: 12px 0 0 0;
      border-top: 1px solid #e0e6e3;
      margin-top: 8px;
      flex-shrink: 0; /* Locks down the control buttons cleanly at bottom */
    }

    .close-button {
      color: #008a4c;
      font-weight: 500;
    }

    /* Dedicated Mobile Layout Configuration Overrides */
    @media (max-width: 600px) {
      .fuji-dialog {
        width: 100%;
        max-width: 100%;
        max-height: 78vh; /* Reduces vertical claim to protect mobile screen configurations */
      }

      .dialog-title {
        font-size: 18px;
        padding-bottom: 10px;
        word-break: break-word;
      }

    .dialog-content {
  /* Change right padding from 4px to 12px */
  padding: 16px 12px 10px 12px; 
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-y: auto !important;
  flex-grow: 1; 
}


      .progress-note-panel {
        border-left-width: 3px;
        margin-bottom: 8px;
      }

      .note-panel-header {
        min-height: 58px !important;
        padding: 0 10px !important;
      }

      .user-icon {
        margin-right: 7px;
      }

      .note-user {
        font-size: 13px;
      }

      .note-date {
        font-size: 11px;
      }

      .note-text {
        padding: 2px 10px 12px 10px;
        font-size: 13px;
        line-height: 1.5;
      }

      .empty-container {
        min-height: 180px;
        padding: 20px 10px;
      }

      .empty-title {
        font-size: 16px;
      }

      .empty-message {
        font-size: 13px;
      }

      .dialog-actions {
        padding-top: 10px;
      }

      .close-button {
        width: 100%;
        min-height: 40px;
        background-color: #f4fbf7; /* Better touch targets for thumb actions */
        border-radius: 4px;
      }
    }
  `]
})
export class TicketProgressNotesDialogComponent implements OnInit {
  notes: TicketProgressNoteDto[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<TicketProgressNotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: number }
  ) {}

  ngOnInit(): void {
    this.loadProgressNotes();
  }

  private loadProgressNotes(): void {
    if (!this.data?.ticketId) {
      this.loading = false;
      this.errorMessage = 'Invalid ticket.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.ticketService.getProgressNotes(this.data.ticketId).subscribe({
      next: (response) => {
        this.notes = response || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load progress notes:', err);
        this.errorMessage = err?.error?.message || 'Unable to load progress notes.';
        this.cdr.detectChanges();

        this.snackBar.open(
          this.errorMessage,
          'Close',
          { duration: 4000 }
        );
      }
    });
  }

  formatDate(value: string | Date): string {
    if (!value) {
      return '';
    }

    let date: Date;

    if (typeof value === 'string') {
      const utcValue = value.endsWith('Z') ? value : `${value}Z`;
      date = new Date(utcValue);
    } else {
      date = value;
    }

    if (isNaN(date.getTime())) {
      return '';
    }

  return new Intl.DateTimeFormat('en-IN', {
day: '2-digit',
month: 'short',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
hour12: true,
timeZone: 'Asia/Kolkata'
}).format(date);
}
}
