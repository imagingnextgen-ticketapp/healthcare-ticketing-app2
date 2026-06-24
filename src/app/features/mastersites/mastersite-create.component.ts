import { ChangeDetectorRef, Component, Inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { finalize } from "rxjs";

import { MasterSiteService } from "../../core/services/mastersite.service";
import { MaterialModules } from "../../shared/material.collection";

@Component({
  selector: 'app-mastersite-create',
  standalone: true,
  templateUrl: './mastersite-create.component.html',
  styleUrls: ['./mastersite-create.component.scss'],
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MaterialModules 
  ],
})
export class MasterSiteCreateComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private service: MasterSiteService,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<MasterSiteCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.isEdit = this.data?.mode === 'edit';
    this.initForm();
  }

 private initForm(): void {
  // Determine initial status value cleanly
  const initialStatus = this.data?.site?.isActive ?? true;

  this.form = this.fb.group({
    masterSiteId: [this.data?.site?.masterSiteId || 0],
    name: [this.data?.site?.name || '', [Validators.required, Validators.minLength(3)]],
    phoneNumber: [this.data?.site?.phoneNumber || ''],
    address: [this.data?.site?.address || '', [Validators.required]],
    
    // 🟢 FIXED: Checkbox stays enabled (green) on creation, but turns read-only (disabled) on edit
    isActive: [{ value: initialStatus, disabled: this.isEdit }] 
  });
}

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    
    // 🟢 NOTE: getRawValue() safely extracts values from disabled controls like isActive
    const formValue = this.form.getRawValue();

    const payload: any = {
      masterSiteId: formValue.masterSiteId,
      name: formValue.name,
      phoneNumber: formValue.phoneNumber,
      address: formValue.address,
      isActive: formValue.isActive
    };

    const request$ = this.isEdit 
      ? this.service.update(payload) 
      : this.service.create(payload);

    request$.pipe(
      finalize(() => {
        this.loading = false;
        this.cdRef.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.snackBar.open(`Site ${this.isEdit ? 'Updated' : 'Added'} Successfully`, 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Save failed. Please try again.';
        this.snackBar.open(errorMsg, 'Close');
        console.error(err);
      }
    });
  }
}
