import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModules } from '../../../shared/material.collection';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password-dialog',
  imports: [CommonModule, MaterialModules, FormsModule],
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss']
})
export class ResetPasswordDialogComponent {
  newPassword = '';
  hide = true; // For the password visibility toggle

  constructor(
    public dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string }
  ) {}
}
