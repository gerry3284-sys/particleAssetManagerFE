import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layout/auth-layout/auth-layout';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout';
import { AssetListComponent } from './features/assets/pages/asset-list/asset-list';
import { AssetCreateComponent } from './features/assets/pages/asset-create/asset-create'; 
import { UserListComponent } from './features/users/pages/user-list/user-list';
import { LoginComponent } from './features/auth/login/login';
import { AssetDetailComponent } from './features/assets/pages/asset-detail/asset-detail';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Layout per autenticazione (senza sidebar)
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      { path: '', component: LoginComponent }
    ]
  },
  
  // Layout principale (con sidebar)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // Assets
      { path: 'assets', component: AssetListComponent },
      { path: 'assets/new', component: AssetCreateComponent },
      { path: 'assets/:id', component: AssetDetailComponent },      
      // Users
      { path: 'users', component: UserListComponent },
      
      // Default redirect
      { path: '', redirectTo: 'assets', pathMatch: 'full' }
    ]
  },
  
  // Wildcard
  { path: '**', redirectTo: 'login' }
];