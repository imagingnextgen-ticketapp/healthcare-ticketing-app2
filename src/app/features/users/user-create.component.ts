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
  roles: any[] = []; 
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
  this.initForm();
  
  // 🔥 CRITICAL LIFECYCLE SYNC: Load the lookup list first, then resolve selections
  this.loadAndFilterRoles();
}

private initForm(): void {
  // Extract primitive ID safely matching both "User" and "UserResponseDto" shapes
  const initialRoleId = this.data?.roleId ?? null;

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
    
    isActive: [{ value: this.isEdit ? (this.data?.isActive ?? false) : true, disabled: true }]
  });
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
    if (this.form.invalid) return;

    const payload = this.form.getRawValue();
    const request = this.isEdit 
      ? this.userService.updateUser(payload) 
      : this.userService.createUser(payload);

    request.subscribe({
      next: () => {
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
