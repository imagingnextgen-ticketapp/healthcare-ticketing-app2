import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; 
import { TemplateService } from '../../core/services/template.service';
import { MaterialModules } from '../../shared/material.collection';
import { TicketService } from '../../core/services/ticket.service';
import { SiteProductService } from '../../core/services/site-product.service';
import { MasterSiteService } from '../../core/services/mastersite.service';
import { AuthService } from '../../core/services/auth.service';
import { TicketAttachmentService } from '../../core/services/ticket-attachment.service';
import { TicketSeverity } from '../../core/models/ticketseverity-enum';
import imageCompression from 'browser-image-compression';
import { ReplaceAttachmentDto, TicketAttachment } from '../../core/models/ticket-attachment.model';
import { UpdateTicketDto } from '../../core/models/ticket.model';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, MaterialModules, ReactiveFormsModule],
  templateUrl: './ticket-create.component.html',
  styleUrls: ['./ticket-create.component.scss']
})
export class TicketCreateComponent implements OnInit {
  form!: FormGroup;
  masterSites: any[] = [];
  products: any[] = [];
  templates: any[] = [];
  currentUser: any;
  loading = false;

  // DUAL-MODE TRACKING STATES
  isEditMode = false;
  editingTicketId: number | null = null;
  existingAttachments: TicketAttachment[] = [];
    // 🔒 GLOBAL PERMISSION STATE HOOK
  isReadOnly = false; 


  // IN-LINE FILE REPLACEMENT STATES
  replacingAttachmentId: number | null = null;
  stagedReplacementFile: File | null = null;
  savedRowVersion: string | undefined = undefined;
  // Multiple File Queue State (For standard Creation Mode)
  selectedFiles: File[] = [];
  fileErrorMessage: string | null = null;
  private readonly maxFileSize = 10 * 1024 * 1024; // Strict 10MB limit per file
  private readonly allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx'];

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private siteProductService: SiteProductService,
    private masterSiteService: MasterSiteService,
    private templateService: TemplateService,
    private authService: AuthService,
    private attachmentService: TicketAttachmentService, 
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TicketCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any 
  ) {
    this.currentUser = this.authService.getUser();
    
    if (this.data && this.data.ticketId) {
      this.isEditMode = true;
      this.editingTicketId = Number(this.data.ticketId);
    }
  }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditMode && this.editingTicketId) {
      this.loadTicketDetailsForEdit(this.editingTicketId);
    } else {
      this.loadInitialSiteList();
    }
  }

   private initForm(): void {
    // If SuperAdmin has no site, initialize with null but mark as pristine
    const initialSiteValue = this.currentUser?.masterSiteId || null;

    this.form = this.fb.group({
      masterSiteId: [initialSiteValue, Validators.required],
      productId: [null, Validators.required],
      templateId: [null, Validators.required],
      description: ['', [Validators.required]], 
      severity: [null, Validators.required],    
      priority: [{ value: '', disabled: true }], // Auto-populated, read-only
      tatHours: [{ value: 0, disabled: true }],  // Auto-populated, read-only
      issueType: [''],   
    });
  }


  // PRODUCTION-READY COMPRESSION METHOD (browser-image-compression)
  private async compressFileIfNeeded(file: File): Promise<File> {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return file; 
    }
    const options = {
      maxSizeMB: 2,          
      maxWidthOrHeight: 1920 
    };
    try {
      const compressedBlob = await imageCompression(file, options);
      return new File([compressedBlob], file.name, { type: file.type });
    } catch (error) {
      console.error('Compression failed, using original file:', error);
      return file; 
    }
  }


  // 1. LOAD DETAILS - Entry point for Edit Mode
  private loadTicketDetailsForEdit(ticketId: number): void {
    setTimeout(() => {
      this.loading = true;
      this.cdr.detectChanges();
    }, 0);

    this.fetchTicketAndDependencies(ticketId);
  }
  
     // 2. FETCH TICKET - Extracts payload, maps attachments, and runs security checks
    // 2. FETCH TICKET - Extracts payload, resolves attachments, and safely manages view lifecycle states
  private fetchTicketAndDependencies(ticketId: number): void {
    this.ticketService.getTicketById(ticketId).subscribe({
      next: (ticketResponse: any) => {
        const ticket = ticketResponse?.data || ticketResponse?.item || ticketResponse;

        if (!ticket) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        const siteId = ticket.masterSiteId || ticket.MasterSiteId;
        const prodId = ticket.productId || ticket.ProductId;
        const templateId = ticket.templateId || ticket.TemplateId;
        
        // =========================================================================
        // 🟢 FIX: ROBUST ATTACHMENT NORMALIZATION TO PREVENT EMPTY STATE DISPLAYS
        // =========================================================================
        const rawAttachments = ticket.attachments || ticket.Attachments || ticket.ticketAttachments || [];
        this.existingAttachments = rawAttachments.map((att: any) => ({
          attachmentId: att.attachmentId || att.AttachmentId,
          blobFileName: att.blobFileName || att.BlobFileName || att.fileName || 'Attached Document',
          fileSize: att.fileSize || att.FileSize || 0
        }));

        this.savedRowVersion = ticket.rowVersion || ticket.RowVersion;

        if (!siteId) {
          console.error('CRITICAL: masterSiteId is missing in data payload:', ticket);
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // =========================================================================
// BACKEND ALIGNED VALIDATION GUARD
// =========================================================================

const currentUserId =
  this.currentUser?.userId || this.currentUser?.UserId;

const createdByUserId =
  ticket.createdByUserId || ticket.CreatedByUserId;

const assignedToUserId =
  ticket.assignedToUserId || ticket.AssignedToUserId;

const role = String(
  this.currentUser?.roleName ||
  this.currentUser?.RoleName ||
  this.currentUser?.role ||
  ''
).trim().toLowerCase();

const status = String(
  ticket.status || ticket.Status || ''
).trim().toLowerCase();

const isEditableStatus =
  status === 'open' ||
  status === 'assigned' ||
  status === 'reopened' ||
  status === '1' ||
  status === '2' ||
  status === '5';

let hasPermission = false;

if (isEditableStatus) {

  if (role === 'superadmin' || role === 'super admin') {
    hasPermission = true;
  }
  else if (role === 'hospitaladmin' || role === 'hospital admin') {
    hasPermission = true;
  }
  else if (role === 'hospitaluser' || role === 'hospital user') {
    hasPermission =
      String(currentUserId) === String(createdByUserId);
  }
  else if (role === 'supportengineer' || role === 'support engineer') {
    hasPermission =
      String(currentUserId) === String(createdByUserId) ||
      String(currentUserId) === String(assignedToUserId);
  }
}

this.isReadOnly = !hasPermission;

if (this.isReadOnly) {
  this.snackBar.open(
    'Viewing in Read-Only Mode: You do not have permission to modify this ticket.',
    'OK',
    { duration: 10000 }
  );
}
// =========================================================================
        const elevatedRoles = ['Superadmin', 'Manager', 'Support Engineer', 'SuperAdmin'];
        const userRoleOriginal = this.currentUser?.role || this.currentUser?.['http://xmlsoap.org'];
        const assignedSiteId = this.currentUser?.masterSiteId || this.currentUser?.MasterSiteId 
          ? Number(this.currentUser?.masterSiteId || this.currentUser?.MasterSiteId) 
          : null;

        const isRestrictedUser = !elevatedRoles.includes(userRoleOriginal);

        if (isRestrictedUser && assignedSiteId && siteId !== assignedSiteId) {
          this.snackBar.open('Unauthorized: You do not have permission to view this ticket.', 'Close', { duration: 5000 });
          this.dialogRef.close();
          return;
        }

        // =========================================================================
        // 🟢 FIX: ASYNC TIMEOUT BOUNDARIES TO ELIMINATE NG0100 RUNTIME ERRORS
        // =========================================================================
        if (isRestrictedUser && assignedSiteId) {
          setTimeout(() => {
            this.masterSites = [{
              id: assignedSiteId,
              masterSiteId: assignedSiteId,
              name: this.currentUser?.MasterSiteName || this.currentUser?.masterSiteName || 'My Assigned Hospital Site' 
            }];
            this.loadProductsAndTemplates(siteId, prodId, templateId, ticket, this.isReadOnly);
            this.cdr.detectChanges();
          }, 0);
          
        } else {
          this.masterSiteService.getSites({ pageNumber: 1, pageSize: 1000 }).subscribe({
            next: (sitesRes: any) => {
              const fetchedSites = sitesRes?.data || sitesRes?.items || sitesRes || [];
              
              setTimeout(() => {
                this.masterSites = fetchedSites;
                this.loadProductsAndTemplates(siteId, prodId, templateId, ticket, this.isReadOnly);
                this.cdr.detectChanges();
              }, 0);
            },
            error: () => { 
              this.loading = false; 
              this.cdr.detectChanges(); 
            }
          });
        }
      },
      error: (err: any) => {
        console.error('Failed to locate ticket information:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 3. LOAD DEPENDENCIES - Chains dropdown fields and safely binds values to the UI form controls
  
 private loadProductsAndTemplates(siteId: number, prodId: number, templateId: number, ticket: any, isReadOnly: boolean = false): void {
  this.siteProductService.getProductsViewDetails(siteId).subscribe({
    next: (prodRes: any) => {
      // 🟢 Extract the raw array data first, do not assign it to 'this.products' yet
      const fetchedProducts = Array.isArray(prodRes) ? prodRes : (prodRes?.data || prodRes?.items || []);

      this.templateService.getTemplateViewByProduct(prodId).subscribe({
        next: (tempRes: any) => {
          const fetchedTemplates = tempRes || [];

          // 🟢 Wrap ALL UI state properties inside a safe macrotask frame
          setTimeout(() => {
            // Assign data arrays simultaneously 
            this.products = fetchedProducts;
            this.templates = fetchedTemplates;

            this.form.get('masterSiteId')?.disable({ emitEvent: false });

            this.form.patchValue({
              productId: prodId,
              templateId: templateId,
              description: ticket.description || ticket.Description || '',
              severity: ticket.severity !== undefined ? ticket.severity : ticket.Severity,
              priority: ticket.priority || ticket.Priority,
              tatHours: ticket.tatHours !== undefined ? ticket.tatHours : (ticket.TatHours || 0),
              issueType: ticket.issueType || ticket.IssueType || ''
            }, { emitEvent: false });

            this.form.get('masterSiteId')?.setValue(siteId, { emitEvent: false, onlySelf: true });

            // =========================================================================
            // CONDITIONAL CONTROL ENABLING
            // =========================================================================
            if (isReadOnly) {
              this.form.get('productId')?.disable({ emitEvent: false });
              this.form.get('templateId')?.disable({ emitEvent: false });
              this.form.get('description')?.disable({ emitEvent: false });
              this.form.get('severity')?.disable({ emitEvent: false });
            } else {
              this.form.get('productId')?.enable({ emitEvent: false });
              this.form.get('templateId')?.enable({ emitEvent: false });
              this.form.get('description')?.enable({ emitEvent: false });
              this.form.get('severity')?.enable({ emitEvent: false });
            }

            this.loading = false;
            
            // Explicitly force change detection to finalize the layout state cleanly
            this.cdr.detectChanges();
          }, 50);
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    },
    error: () => { this.loading = false; this.cdr.detectChanges(); }
  });
}





// INLINE FILE REPLACEMENT LOGIC
    startReplacement(attachmentId: number): void {
    // 🛡️ Guard clause to block attachment edits if form is read-only
    if (this.isReadOnly) {
      this.snackBar.open('Unauthorized: You cannot modify attachments on this ticket.', 'OK', { duration: 3000 });
      return;
    }

    this.replacingAttachmentId = attachmentId;
    this.stagedReplacementFile = null;
    this.fileErrorMessage = null;
    this.cdr.detectChanges();
  }


  cancelReplacement(): void {
    this.replacingAttachmentId = null;
    this.stagedReplacementFile = null;
    this.fileErrorMessage = null;
    this.cdr.detectChanges();
  }

  async onReplacementFileSelected(event: Event): Promise<void> {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    this.fileErrorMessage = null;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!this.allowedExtensions.includes(extension)) {
        this.fileErrorMessage = `Unsupported format. Allowed: ${this.allowedExtensions.join(', ')}`;
        element.value = '';
        return;
      }

      const processedFile = await this.compressFileIfNeeded(file);

      if (processedFile.size > this.maxFileSize) {
        this.fileErrorMessage = `"${processedFile.name}" exceeds the strict 10MB limit.`;
        element.value = '';
        return;
      }

      this.stagedReplacementFile = processedFile;
    }
    this.cdr.detectChanges();
  }

  confirmFileReplacement(): void {
    if (!this.replacingAttachmentId || !this.stagedReplacementFile) return;

    this.loading = true;
    this.cdr.detectChanges();

    const dto: ReplaceAttachmentDto = {
      attachmentId: this.replacingAttachmentId,
      file: this.stagedReplacementFile
    };

    this.attachmentService.replaceAttachment(dto).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(response.message || 'File replaced successfully.', 'OK', { duration: 3000 });

        const index = this.existingAttachments.findIndex(a => a.attachmentId === this.replacingAttachmentId);
        if (index !== -1 && this.stagedReplacementFile) {
          this.existingAttachments[index].blobFileName = this.stagedReplacementFile.name;
          this.existingAttachments[index].fileSize = this.stagedReplacementFile.size;
        }

        this.cancelReplacement();
      },
      error: (err) => {
        this.loading = false;
        const errMsg = err.error?.message || 'File replacement request failed.';
        this.snackBar.open(errMsg, 'OK', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }

  // PROCESS BATCH FILE SELECTION VIA CREATE QUEUE (With Image Compression)
  public processFiles(files: File[]): void {
    this.fileErrorMessage = null;
    
    setTimeout(async () => {
      for (const file of files) {
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!this.allowedExtensions.includes(extension)) {
          this.fileErrorMessage = `Unsupported format. Allowed: ${this.allowedExtensions.join(', ')}`;
          continue;
        }

        const processedFile = await this.compressFileIfNeeded(file);

        const isDuplicate = this.selectedFiles.some(f => f.name === processedFile.name && f.size === processedFile.size);
        if (isDuplicate) continue;

        if (processedFile.size > this.maxFileSize) {
          this.fileErrorMessage = `"${processedFile.name}" exceeds the strict 10MB limit.`;
        } else {
          this.selectedFiles.push(processedFile);
        }
      }
      this.cdr.detectChanges();
    }, 0);
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.processFiles(Array.from(fileList));
    }
    element.value = ''; 
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  removeFileFromQueue(indexToRemove: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, index) => index !== indexToRemove);
    this.cdr.detectChanges();
  }

  clearAllFiles(): void {
    this.selectedFiles = [];
    this.fileErrorMessage = null;
    this.cdr.detectChanges();
  }

  loadInitialSiteList(): void {
    const role = this.currentUser?.role;
    if (role === 'SuperAdmin' || role === 'SupportEngineer') {
      this.masterSiteService.getSites({ pageNumber: 1, pageSize: 1000 }).subscribe(res => {
        this.masterSites = res.data || res.items || res; 
        this.cdr.detectChanges();
      });
    } else if (this.currentUser?.masterSiteId) {
      this.masterSiteService.getSiteViewDetails(this.currentUser.masterSiteId).subscribe(res => {
        this.masterSites = [res];
        this.form.get('masterSiteId')?.setValue(this.currentUser.masterSiteId);
        this.loadProductsForSite(this.currentUser.masterSiteId);
        this.cdr.detectChanges();
      });
    }
  }
  onSiteChange(siteId: number): void {
    // 1. Reset everything to null first to clear out previous selections
    this.form.patchValue({ 
      productId: null, 
      templateId: null, 
      issueType: '', 
      description: '', 
      severity: null, 
      priority: '', 
      tatHours: 0 
    }, { emitEvent: false });

    // 2. Completely empty out your component's template and product arrays
    this.products = [];
    this.templates = [];
    
    this.clearAllFiles();
    this.loadProductsForSite(siteId);
  }

   private loadProductsForSite(siteId: number): void {
    this.siteProductService.getProductsViewDetails(siteId).subscribe({
      next: (res: any) => {
        this.products = Array.isArray(res) ? res : (res.data || res.items || []);

        if (this.products && this.products.length === 1) {
          const firstItem = this.products[0];
          
          // 🟢 FIXED: Force it to pick 'productId' (e.g. 26) instead of the row 'Id' (e.g. 39)
          const firstProdId = firstItem?.productId || firstItem?.ProductId;

          if (firstProdId) {
            this.form.get('productId')?.setValue(firstProdId);
            this.onProductChange(firstProdId);
          }
        }
        this.cdr.detectChanges();
      }
    });
  }



onProductChange(productId: number): void {
  this.form.patchValue({
    templateId: null,
    issueType: '',
    description: '',
    severity: null,
    priority: '',
    tatHours: 0
  });

  this.templateService
    .getTemplateViewByProduct(productId)
    .subscribe({
      next: (res) => {
        this.templates = res;
        this.cdr.detectChanges();
      }
    });
}

onTemplateChange(templateId: number): void {
  const selected = this.templates.find(
    t => t.templateId === templateId
  );

  if (selected) {

    let uiSeverityValue = selected.severity;

    if (
      selected.severity !== undefined &&
      selected.severity !== null &&
      !isNaN(Number(selected.severity))
    ) {

      const severityNumber = Number(selected.severity);

      const mappedString =
        TicketSeverity[severityNumber];

      uiSeverityValue =
        mappedString
          ? mappedString
          : 'Low';
    }

    setTimeout(() => {

      this.form.patchValue({
        description:
          selected.description ||
          selected.issueType,

        issueType:
          selected.issueType,

        severity:
          uiSeverityValue,

        priority:
          selected.priority,

        tatHours:
          selected.tatHours
      });

      this.cdr.detectChanges();

    }, 0);
  }
}

   // =====================================================
  // CORE SUBMISSION PIPE (FIXED PAYLOAD ROUTINE)
  // =====================================================
  onSubmit(): void {
    if (this.isReadOnly && this.isEditMode) {
      this.snackBar.open('Unauthorized: Form submission is blocked in read-only mode.', 'Close', { duration: 4000 });
      return;
    }
    if (this.form.invalid || this.loading) return;

    // 🛡️ Bypass Angular ExpressionChanged lifecycle clashes cleanly
    setTimeout(() => {
      this.loading = true;
      this.cdr.detectChanges();
    }, 0);

    setTimeout(() => {
      // 🟢 Uses getRawValue() to pull masterSiteId from disabled fields securely
      const rawForm = this.form.getRawValue();
      console.log('--- 🛡️ DEBUGGING TICKET CREATION PAYLOAD ---');
      console.log('Raw Form State Data Object:', rawForm);
      console.log('Product ID value from Form Control:', this.form.get('productId')?.value);
      console.log('Template ID value from Form Control:', this.form);
      
      // 🛡️ SAFE TEXT CONVERSION GUARD: Ensure severity is passed strictly as a text enum string
      let finalizedSeverityString: string = 'Low'; 
      
      if (rawForm.severity !== null && rawForm.severity !== undefined) {
        const severityInput = String(rawForm.severity).trim();
        
        if (!isNaN(Number(severityInput))) {
          const numericIndex = Number(severityInput);
          // Fallback parsing logic mapping numeric enum indexes back to string labels
          finalizedSeverityString = (this as any).TicketSeverity ? (this as any).TicketSeverity[numericIndex] : 'Low';
        } else {
          finalizedSeverityString = severityInput;
        }
      }

      // ---------------------------------------------------
      // BRANCH A: SAVING AN EDIT PAYLOAD [HttpPut]
      // ---------------------------------------------------
      if (this.isEditMode && this.editingTicketId) {
        const updatePayload = {
          ticketId: this.editingTicketId,
          productId: Number(rawForm.productId),
          templateId: Number(rawForm.templateId),
          severity: finalizedSeverityString,
          description: rawForm.description || '',
          masterSiteId: Number(rawForm.masterSiteId),
          
          rowVersion: this.savedRowVersion // 🟢 Automatically included from your component state
        };

        this.ticketService.updateTicket(updatePayload).subscribe({
          next: () => {
            // If the user staged additional screenshots during edit, upload them now
            if (this.selectedFiles && this.selectedFiles.length > 0) {
              this.attachmentService.uploadMultiple(this.editingTicketId!, this.selectedFiles).subscribe({
                next: () => {
                  this.loading = false;
                  this.snackBar.open('Ticket specifications and new attachments updated successfully!', 'Close', { 
                    duration: 5000, panelClass: ['fuji-snackbar-success'] 
                  });
                  this.dialogRef.close(true);
                },
                error: (uploadErr: any) => {
                  this.loading = false;
                  this.snackBar.open('Text updated, but new attachment upload failed.', 'OK', { duration: 5000 });
                  this.cdr.detectChanges();
                }
              });
            } else {
              this.loading = false;
              this.snackBar.open('Ticket specifications updated successfully!', 'Close', { 
                duration: 5000, panelClass: ['fuji-snackbar-success'] 
              });
              this.dialogRef.close(true);
            }
          },
          error: (err: any) => this.handleBackendError(err)
        });

      // ---------------------------------------------------
      // BRANCH B: STANDARD CREATION MODE PAYLOAD ROUTINE [HttpPost]
      // ---------------------------------------------------
      } else {
        const hoursValue = rawForm.tatHours !== null && rawForm.tatHours !== undefined ? Number(rawForm.tatHours) : 0;
        
        // 🟢 CORRECTED COMPACT VALID PAYLOAD Footprint Structure
        const payload = {
          masterSiteId: Number(rawForm.masterSiteId), // Placed first for predictable serialization
          productId: Number(rawForm.productId),
          templateId: Number(rawForm.templateId),
          description: rawForm.description || '',
          issueType: rawForm.issueType || '',
          priority: rawForm.priority || 'Low',
          severity: finalizedSeverityString,
          tatHours: hoursValue
        };

        this.ticketService.createTicket(payload).subscribe({
          next: (res: any) => {
            const generatedTicketId = res?.ticketId || res?.id;
            if (this.selectedFiles && this.selectedFiles.length > 0 && generatedTicketId > 0) {
              this.attachmentService.uploadMultiple(generatedTicketId, this.selectedFiles).subscribe({
                next: () => (this as any).handleSuccessResponse(generatedTicketId), 
                error: (uploadErr: any) => {
                  this.loading = false;
                  const msg = uploadErr.error?.message || `Ticket #${generatedTicketId} saved, but attachment upload failed.`;
                  this.snackBar.open(msg, 'OK', { duration: 5000 });
                  this.cdr.detectChanges();
                }
              });
            } else {
              if (generatedTicketId) {
                (this as any).handleSuccessResponse(generatedTicketId); 
              } else {
                this.loading = false;
                this.snackBar.open('Ticket log completed.', 'OK', { duration: 3000 });
                this.dialogRef.close(true);
              }
            }
          },
          error: (err: any) => this.handleBackendError(err)
        });
      }
    }, 0); // 🟢 FIXED: Properly closes the inner setTimeout block
  } // 🟢 FIXED: Properly closes the onSubmit method scope

  // Helper method block to process server-side validation error alerts
  private handleBackendError(err: any): void {
    this.loading = false;
    const errMsg = err.error?.message || err.message || 'An unexpected request error occurred.';
    this.snackBar.open(errMsg, 'Close', { duration: 6000 });
    this.cdr.detectChanges();
  }




    // Universal Success Response Handler Pipeline
  private handleSuccessResponse(ticketId?: number): void {
    this.loading = false;

    const successMsg = ticketId
      ? `Ticket #${ticketId} created successfully!`
      : 'Ticket created successfully!';

    this.snackBar.open(successMsg, 'Close', {
      duration: 10000,
      panelClass: ['fuji-snackbar-success']
    });

    this.dialogRef.close(true);
  }
} 





