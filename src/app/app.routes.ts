import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./features/auth/forgotpassword/forgot-password.component').then(m => m.ForgotPasswordComponent) 
  },
 { 
    path: 'reset-password', 
    loadComponent: () => import('./features/auth/login/resetpassword/reset-password.component').then(m => m.ResetPasswordComponent) 
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Dashboard' },
      
      // 🚀 THE FIX: Put system-audit inside the children array
      { 
        path: 'system-audit', 
        loadComponent: () => import('./features/audit-logs-modules/audit-log.component').then(m => m.AuditListComponent), 
        title: 'System Audit' 
      },

      { path: 'history', loadComponent: () => import('./features/audit-history/ticket-history.component').then(m => m.TicketHistoryComponent), title: 'Audit Trail' },
      { path: 'mis-report', loadComponent: () => import('./features/reports/mis-report.component').then(m => m.MisReportComponent), title: 'MIS Analytics' },
      { path: 'tickets', loadComponent: () => import('./features/tickets/ticket-worklist.component').then(m => m.TicketWorklistComponent), title: 'Worklist' },
      { path: 'tickets/create', loadComponent: () => import('./features/tickets/ticket-worklist.component').then(m => m.TicketWorklistComponent), title: 'Log New Ticket' },
      { path: 'mapping/user-sites', loadComponent: () => import('./features/mapping/user-sites/user-site-mapping.component').then(m => m.UserSiteMappingComponent) },
      { path: 'products/mapping', loadComponent: () => import('./features/mapping/product-site/site-product-mapping.component').then(m => m.SiteProductMappingComponent) },
      { path: 'assets', loadComponent: () => import('./features/products/product-list.component').then(m => m.ProductListComponent) },
      { path: 'users', loadComponent: () => import('./features/users/user-list.component').then(m => m.UserListComponent) },
      { path: 'mastersites', loadComponent: () => import('./features/mastersites/mastersite-list.component').then(m => m.MasterSiteListComponent) },
      { path: 'templates', loadComponent: () => import('./features/templates/template-list.component').then(m => m.TemplateListComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
