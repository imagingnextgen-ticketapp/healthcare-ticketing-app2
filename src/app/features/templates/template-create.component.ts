import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplateService } from '../../core/services/template.service';
import { ProductService } from '../../core/services/product.service';
import { MaterialModules } from '../../shared/material.collection';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-template-create',
  standalone: true,
  encapsulation: ViewEncapsulation.None, 
  imports: [CommonModule, MaterialModules, ReactiveFormsModule],
  templateUrl: './template-create.component.html',
  styleUrls: ['./template-create.component.scss']
})
export class TemplateCreateComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  products: any[] = [];
  isLoading = false;
  
  severities = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Critical' }
];

  constructor(
    private fb: FormBuilder,
    private templateService: TemplateService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<TemplateCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data;
    this.initForm();
    this.loadProducts();
  }

initForm() {
  this.form = this.fb.group({
    templateId: [this.data?.templateId || 0],
    productId: [this.data?.productId ?? null, Validators.required],
    issueType: [this.data?.issueType ?? '', [Validators.required, Validators.maxLength(100)]],
    description: [this.data?.description ?? ''],

    severity: [this.isEdit ? this.data?.severity : null, Validators.required],

    priority: [this.isEdit ? this.data?.priority : null, Validators.required],

    slaHours: [this.data?.slaHours ?? 0, [Validators.required, Validators.min(0)]],
    isActive: [this.data?.isActive ?? true]
  });
}

  loadProducts() {
    this.isLoading = true;
    this.productService.getProducts({ pageNumber: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        this.products = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.showSnackBar('Error loading products');
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const payload = this.form.value;
    const request$ = this.isEdit 
      ? this.templateService.update(payload) 
      : this.templateService.create(payload);

    request$.subscribe({
      next: () => {
        this.showSnackBar(this.isEdit ? 'Template Updated' : 'Template Created');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.showSnackBar(err.error?.message || 'Failed to save');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * FIXED: Added toggleStatus method to resolve TS2339 error
   */
  toggleStatus() {
    if (!this.data?.templateId) return;
    
    const currentlyActive = this.form.get('isActive')?.value;
    const action$ = currentlyActive 
      ? this.templateService.deactivateTemplate(this.data.templateId)
      : this.templateService.activateTemplate(this.data.templateId);

    action$.subscribe({
      next: () => {
        this.showSnackBar(`Template ${currentlyActive ? 'Deactivated' : 'Activated'} Successfully`);
        this.dialogRef.close(true);
      },
      error: (err) => this.showSnackBar(err.error?.message || 'Failed to update status')
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'OK', { 
      duration: 3000,
      panelClass: ['fuji-snackbar']
    });
  }
}
