import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TicketService } from '../../core/services/ticket.service';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  selector: 'app-ticket-add-progress-note-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MaterialModules
  ],
  template: `
    <div class="fuji-dialog">

      <!-- Header -->
      <h2
        mat-dialog-title
        class="dialog-title"
      >
        Add Progress Note - Ticket #{{ data.ticketId }}
      </h2>

      <form
        [formGroup]="noteForm"
        (ngSubmit)="submitNote()"
      >

        <!-- Content -->
        <mat-dialog-content class="dialog-content">

          <p class="dialog-description">
            Add a progress update, troubleshooting step,
            or technical remark for this ticket.
          </p>

          <mat-form-field
            appearance="outline"
            class="full-width"
          >

            <mat-label>
              Progress Note
            </mat-label>

            <textarea
              matInput
              formControlName="note"
              rows="6"
              maxlength="4000"
              placeholder="Enter your progress update..."
              cdkFocusInitial
            >
            </textarea>

            <mat-hint align="end">
              {{
                noteForm.get('note')?.value?.length || 0
              }}/4000
            </mat-hint>

            <mat-error
              *ngIf="
                noteForm.get('note')?.hasError('required')
              "
            >
              Progress note is required.
            </mat-error>

            <mat-error
              *ngIf="
                noteForm.get('note')?.hasError('minlength')
              "
            >
              Please enter at least 5 characters.
            </mat-error>

          </mat-form-field>

        </mat-dialog-content>

        <!-- Actions -->
        <mat-dialog-actions
          align="end"
          class="dialog-actions"
        >

          <button
            type="button"
            mat-button
            mat-dialog-close
            [disabled]="loading"
          >
            Cancel
          </button>

          <button
            type="submit"
            mat-flat-button
            class="save-button"
            [disabled]="noteForm.invalid || loading"
          >
            {{
              loading
                ? 'Saving...'
                : 'Add Progress Note'
            }}
          </button>

        </mat-dialog-actions>

      </form>

    </div>
  `,

  styles: [`
    .fuji-dialog {
      width: 100%;
      max-width: 650px;
      box-sizing: border-box;
    }

    .dialog-title {
      margin: 0;
      padding: 0 0 12px 0;
      border-bottom: 1px solid #e0e6e3;
      color: #008a4c;
      font-weight: 600;
      line-height: 1.4;
    }

    .dialog-content {
      padding-top: 20px;
      box-sizing: border-box;
    }

    .dialog-description {
      margin: 0 0 16px 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
    }

    textarea {
      resize: vertical;
      min-height: 130px;
    }

    .dialog-actions {
      padding: 12px 0 0 0;
      gap: 8px;
    }

    .save-button {
      background-color: #008a4c !important;
      color: #ffffff !important;
    }

    .save-button:disabled {
      opacity: 0.6;
    }

    @media (max-width: 600px) {

      .fuji-dialog {
        width: 100%;
        max-width: 100%;
      }

      .dialog-title {
        font-size: 20px;
        padding-bottom: 10px;
      }

      .dialog-content {
        padding: 16px 0 0 0;
      }

      .dialog-description {
        font-size: 13px;
      }

      textarea {
        min-height: 120px;
      }

      .dialog-actions {
        flex-direction: column-reverse;
        align-items: stretch;
        width: 100%;
        gap: 8px;
      }

      .dialog-actions button {
        width: 100%;
        min-height: 44px;
      }

    }
  `]
})
export class TicketAddProgressNoteDialogComponent {

  noteForm: FormGroup;

  loading = false;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    public dialogRef:
      MatDialogRef<TicketAddProgressNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      ticketId: number;
    }
  ) {

    this.noteForm = this.fb.group({
      note: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(4000)
        ]
      ]
    });
  }

  submitNote(): void {

    if (
      this.noteForm.invalid ||
      this.loading
    ) {
      this.noteForm.markAllAsTouched();
      return;
    }

    const noteValue =
      this.noteForm.get('note')?.value?.trim();

    if (!noteValue) {
      this.noteForm
        .get('note')
        ?.setValue('');

      this.noteForm.markAllAsTouched();

      return;
    }

    this.loading = true;

    const dto = {
      ticketId: this.data.ticketId,
      note: noteValue
    };

    this.ticketService
      .addProgressNote(dto)
      .subscribe({

        next: () => {

          this.loading = false;

          this.snackBar.open(
            'Progress note added successfully.',
            'OK',
            {
              duration: 3000
            }
          );

          this.dialogRef.close(true);
        },

        error: (err) => {

          this.loading = false;

          console.error(
            'Failed to add progress note:',
            err
          );

          const message =
            err?.error?.message ||
            'Failed to add progress note.';

          this.snackBar.open(
            message,
            'Close',
            {
              duration: 4000
            }
          );
        }
      });
  }
}