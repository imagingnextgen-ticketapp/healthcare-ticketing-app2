import { Component, OnInit, Inject, Optional, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductService } from '../../core/services/product.service';
import { finalize } from 'rxjs/operators';
import { MaterialModules } from '../../shared/material.collection';

@Component({
  standalone: true,
  selector: 'app-product-create',
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss'],
  providers: [provideNativeDateAdapter()], // Required for Datepicker
    imports: [CommonModule, MaterialModules],
})
export class ProductCreateComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Optional() public dialogRef: MatDialogRef<ProductCreateComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = this.data?.mode === 'edit';
  }

  ngOnInit(): void {
    this.initForm();
    setTimeout(() => {
    this.cdr.detectChanges();
  });
  }

  private initForm(): void {
  this.form = this.fb.group({
    name: [this.data?.product?.name || '', [Validators.required]], // Already 'name'
    isActive: [this.data?.product?.isActive ?? true],
    createdDate: [
      { value: this.data?.product?.createdDate || new Date(), disabled: this.isEdit },
      [Validators.required]
    ]
  });
}


   onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close(); // Closes the dialog
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    // getRawValue() ensures createdDate is sent even if it is disabled
    const payload = this.form.getRawValue();
    
    if (this.isEdit) {
      payload.productId = this.data.product.productId;
    }

    const action$ = this.isEdit ? this.productService.update(payload) : this.productService.create(payload);

    action$.pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (res: any) => {
        this.snackBar.open(this.isEdit ? 'Product updated' : 'Product created', 'OK', { duration: 3000 });
        this.dialogRef.close(res); 
      },
      error: () => this.snackBar.open('Operation failed', 'Close')
    });
  }
}
