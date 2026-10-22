import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service'; 
import { MaterialModules } from '../../shared/material.collection';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms'; // 🟢 1. ADD THIS IMPORT
import { ErrorStateMatcher } from '@angular/material/core';  
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, MaterialModules, ReactiveFormsModule],
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss']
})
export class UserCreateComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  isHospitalAdmin = false;
  isLoadingUserSites = false;
  userSitesLoadFailed = false;
  roles: any[] = []; 
  assignedSites: { masterSiteId: number; name: string }[] = [];
  siteSearchControl = new FormControl<string | any>('');
 instantMatcher: ErrorStateMatcher = {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
      return !!(control && control.invalid);
    }
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<UserCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

ngOnInit(): void {
  this.isEdit = !!this.data;
  const currentUser = this.authService.getUser();
  this.isHospitalAdmin = currentUser?.role?.toLowerCase() === 'hospitaladmin';
  if (this.isHospitalAdmin) {
    this.assignedSites = (currentUser?.sites || [])
      .map((site: any) => ({
        masterSiteId: Number(site.siteId ?? site.masterSiteId),
        name: site.siteName ?? site.name ?? ''
      }))
      .filter((site: { masterSiteId: number; name: string }) =>
        Number.isInteger(site.masterSiteId) && site.masterSiteId > 0 && !!site.name
      );
  }
  this.initForm();
  if (this.isHospitalAdmin) {
    this.form.get('masterSiteIds')?.setValidators(Validators.required);
    this.form.get('masterSiteIds')?.updateValueAndValidity({ emitEvent: false });
    if (this.isEdit && this.data?.userId) {
      this.loadUserSiteAssignments(Number(this.data.userId));
    }
    if (!this.isEdit && this.assignedSites.length === 0) {
      this.showSnackbar('No assigned hospital sites are available for user creation.');
    }
  }
  
  // 🔥 CRITICAL LIFECYCLE SYNC: Load the lookup list first, then resolve selections
  this.loadAndFilterRoles();
}

private initForm(): void {
  // Extract primitive ID safely matching both "User" and "UserResponseDto" shapes
  const initialRoleId = this.data?.roleId ?? null;
  const initialSiteIds = this.data?.masterSiteIds ??
    (this.data?.masterSiteId != null ? [this.data.masterSiteId] : []);

  this.form = this.fb.group({
    userId: [this.data?.userId || 0],
    firstName: [this.data?.firstName || '', [Validators.required, Validators.maxLength(100)]],
    lastName: [this.data?.lastName || '', [Validators.required, Validators.maxLength(100)]],
    userName: [this.data?.userName || '', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]],
    email: [this.data?.email || '', [Validators.required, Validators.email]],
    password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
    phoneNumber: [this.data?.phoneNumber || '', [Validators.pattern('^[0-9]{7,15}$')]],
    
    // Set the initial value normally, keeping the form field fully interactive
    roleId: [initialRoleId, Validators.required],
    masterSiteId: [initialSiteIds[0] ?? null],
    masterSiteIds: [initialSiteIds.map((siteId: number) => Number(siteId))],
    
    isActive: [{ value: this.isEdit ? (this.data?.isActive ?? false) : true, disabled: true }]
  });
}

private loadUserSiteAssignments(userId: number): void {
  this.isLoadingUserSites = true;
  this.userService.getUserSites(userId).subscribe({
    next: (userSites: any[]) => {
      const allowedSiteIds = new Set(this.assignedSites.map(site => site.masterSiteId));
      const selectedSiteIds = (userSites || [])
        .map(site => Number(site.masterSiteId ?? site.MasterSiteId))
        .filter(siteId => Number.isInteger(siteId) && allowedSiteIds.has(siteId));

      this.form.patchValue({
        masterSiteIds: [...new Set(selectedSiteIds)],
        masterSiteId: selectedSiteIds[0] ?? null
      });
      this.isLoadingUserSites = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.isLoadingUserSites = false;
      this.userSitesLoadFailed = true;
      this.showSnackbar('Could not load this user\'s assigned sites. Close and reopen the user to try again.');
      this.cdr.detectChanges();
    }
  });
}

get filteredAssignedSites(): { masterSiteId: number; name: string }[] {
  const value = this.siteSearchControl.value;
  const query = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return this.assignedSites.filter(site => !query || site.name.toLowerCase().includes(query));
}

get selectedSiteNames(): string[] {
  const selectedIds = this.form?.get('masterSiteIds')?.value as number[] | undefined;
  return this.assignedSites
    .filter(site => (selectedIds || []).includes(site.masterSiteId))
    .map(site => site.name);
}

isSiteSelected(siteId: number): boolean {
  const selectedIds = this.form?.get('masterSiteIds')?.value as number[] | undefined;
  return (selectedIds || []).includes(siteId);
}

toggleSite(site: { masterSiteId: number; name: string }, input: HTMLInputElement): void {
  const selectedIds = (this.form.get('masterSiteIds')?.value || []) as number[];
  const nextSelectedIds = selectedIds.includes(site.masterSiteId)
    ? selectedIds.filter(siteId => siteId !== site.masterSiteId)
    : [...selectedIds, site.masterSiteId];

  this.form.patchValue({
    masterSiteIds: nextSelectedIds,
    masterSiteId: nextSelectedIds[0] ?? null
  });
  input.value = '';
  this.siteSearchControl.setValue('');
}

clearSelectedSites(): void {
  this.form.patchValue({ masterSiteIds: [], masterSiteId: null });
}

private loadAndFilterRoles(): void {
  this.userService.getRoles().subscribe({
    next: (res: any[]) => {
      // 1. Normalize backend properties safely to protect against PascalCase vs camelCase issues
      const normalizedRoles = res.map((role: any) => ({
        roleId: role.roleId ?? role.RoleId ?? role.id,
        roleName: role.roleName ?? role.RoleName
      }));

      const availableRoles = normalizedRoles.filter((role: any) => 
        role.roleName?.toLowerCase() !== 'systemuser'
      );

      const currentUser = this.authService.getUser();
      const loggedInUserRole = currentUser?.role?.toLowerCase();

      if (loggedInUserRole === 'hospitaladmin') {
        this.roles = availableRoles.filter((role: any) => {
          const name = role.roleName?.toLowerCase();
          return name === 'hospitaladmin' || name === 'hospitaluser';
        });
      } else {
        this.roles = availableRoles;
      }

      // 2. 🔥 THE TOKEN STRING FALLBACK MATCH FIX:
      if (this.isEdit && this.data) {
        // First try to look for a numeric ID normally
        let targetId = this.data.roleId ?? this.data.RoleId;

        // If no numeric ID is found, extract the string role name from your XML claim key
        if (targetId === undefined || targetId === null) {
          const roleClaimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
          const stringRoleName = this.data[roleClaimKey] || this.data.roleName || this.data.RoleName;

          if (stringRoleName) {
            // Find the item inside your freshly loaded lookup array that matches the string text name
            const matchedRole = this.roles.find(r => 
              r.roleName?.trim().toLowerCase() === stringRoleName.trim().toLowerCase()
            );
            if (matchedRole) {
              targetId = matchedRole.roleId; // Found it! (e.g., converts "SuperAdmin" to number 1)
            }
          }
        }

        // 3. Apply the final matched numeric key back to the UI selection view layer
        if (targetId !== undefined && targetId !== null) {
          this.form.get('roleId')?.setValue(Number(targetId));
          this.form.get('roleId')?.updateValueAndValidity();
        }
      }

      this.cdr.detectChanges(); 
    },
    error: () => this.showSnackbar('Failed to load access roles')
  });
}




  onSubmit(): void {
    if (this.form.invalid || this.userSitesLoadFailed || this.isLoadingUserSites) return;

    const payload = this.form.getRawValue();
    if (this.isHospitalAdmin) {
      payload.masterSiteIds = payload.masterSiteIds || [];
      payload.masterSiteId = payload.masterSiteIds[0] ?? null;
    }
    if (!this.isHospitalAdmin) {
      delete payload.masterSiteId;
      delete payload.masterSiteIds;
    }
    const request = this.isEdit 
      ? this.userService.updateUser(payload) 
      : this.userService.createUser(payload);

    request.subscribe({
      next: (response: any) => {
        if (this.isHospitalAdmin) {
          const savedSiteIds = (response?.masterSiteIds ?? response?.MasterSiteIds ?? [])
            .map((siteId: number | string) => Number(siteId))
            .sort((a: number, b: number) => a - b);
          const submittedSiteIds = [...payload.masterSiteIds]
            .map((siteId: number | string) => Number(siteId))
            .sort((a: number, b: number) => a - b);

          if (JSON.stringify(savedSiteIds) !== JSON.stringify(submittedSiteIds)) {
            this.showSnackbar('The server did not confirm all selected site assignments. Please verify the user before continuing.');
            this.cdr.detectChanges();
            return;
          }
        }

        this.showSnackbar(this.isEdit ? 'User updated successfully' : 'User created successfully');
        this.dialogRef.close(true);
        
      },
      error: (err) => {
        console.log('FULL ERROR =>', err);
    console.log('ERROR BODY =>', err.error);
        const errorObj = err?.error;
        const errorMessage = errorObj?.message || (typeof errorObj === 'string' ? errorObj : '');

        // 1. Handle Duplicate Username and Force UI Text Updates
        if (errorMessage.toLowerCase().includes('username')) {
          const control = this.form.get('userName');
          if (control) {
            control.setErrors({ duplicate: true });
            control.markAsTouched();
            control.markAsDirty();
          }
          this.cdr.detectChanges(); // <-- Triggers UI rendering instantly
          return;
        }

        // 2. Handle Duplicate Email and Force UI Text Updates
        if (errorMessage.toLowerCase().includes('email')) {
          const control = this.form.get('email');
          if (control) {
            control.setErrors({ duplicate: true });
            control.markAsTouched();
            control.markAsDirty();
          }
          this.cdr.detectChanges(); // <-- Triggers UI rendering instantly
          return;
        }

        // 3. Handle standard .NET Model Validation errors
        if (errorObj?.errors && typeof errorObj.errors === 'object') {
          const validationErrors = Object.values(errorObj.errors).flat();
          if (validationErrors.length > 0) {
            this.showSnackbar(`Validation Error: ${validationErrors[0]}`);
            return;
          }
        }

        // 4. Meaningful Fallback Messages instead of generic text
        if (err.status === 0) {
          this.showSnackbar('Cannot connect to the server. Please check your internet connection.');
        } else if (err.status === 401 || err.status === 403) {
          this.showSnackbar('You do not have permission to perform this action.');
        } else if (err.status === 500) {
          this.showSnackbar('Internal server error. Please try again later or contact support.');
        } else {
          this.showSnackbar(errorMessage || `Server responded with error code ${err.status || 'unknown'}`);
        }
      }
    });
  }
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }
}
