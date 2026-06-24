export interface SystemModule {
  id: string;
  label: string;
  icon: string;
}

export const SYSTEM_MODULES: SystemModule[] = [
  { id: 'Users', label: 'User Management', icon: 'pi pi-users' },
  { id: 'MasterSites', label: 'Site Registry', icon: 'pi pi-building' },
  { id: 'Products', label: 'Product Catalog', icon: 'pi pi-box' },
  { id: 'UserSites', label: 'User-Site Mapping', icon: 'pi pi-id-card' },
  { id: 'Templates', label: 'Ticket Templates', icon: 'pi pi-file-edit' },
  { id: 'SiteProducts', label: 'Site-Product Links', icon: 'pi pi-link' },
  { id: 'AdminPasswordResets', label: 'Security / Password Resets', icon: 'pi pi-lock' }
];

export const ACTION_TYPES = ['Create', 'Update', 'Activate', 'Deactivate', 'BulkAssign','AdminPasswordReset'];
