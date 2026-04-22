import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layout/auth-layout/auth-layout';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout';
import { AssetListComponent } from './features/assets/pages/asset-list/asset-list';
import { UserList } from './features/users/pages/user-list/user-list';
import { UserDetail } from './features/user-detail/user-detail';
import { UserStandard } from './features/area-user/user-standard/user-standard';
import { UserLayoutComponent } from './core/layout/user-layout/user-layout';
import { AssetCreateComponent } from './features/assets/pages/asset-create/asset-create'; 
import { LoginComponent } from './features/auth/login/login';
import { AssetDetailComponent } from './features/assets/pages/asset-detail/asset-detail';
import { NotFoundComponent } from './features/errors/pages/not-found/not-found';
import { AssetTypeList } from './features/asset-type-list/asset-type-list';
import { BusinessUnitList } from './features/business-unit/business-unit-list';
import { AssetMaintenanceListComponent } from './features/assets/pages/asset-maintenance-list/asset-maintenance-list';

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
    path: '', component: UserLayoutComponent,
    children: [
      { path: 'user-standard/:id', component: UserStandard }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // Assets
      { path: 'assets', component: AssetListComponent },
      { path: 'maintenance-assets', component: AssetMaintenanceListComponent },
      { path: 'assets/new', component: AssetCreateComponent },
      { path: 'assets/:assetCode', component: AssetDetailComponent },
      { path: 'asset-types', component: AssetTypeList},
      // BusinessUnit
      { path: 'businessUnits', component: BusinessUnitList},
      // Users
      { path: 'users', component: UserList },
      { path: 'users/user-detail/:id', component: UserDetail },
      { path: '', redirectTo: 'assets', pathMatch: 'full' }
    ]
  },
  
  // Pagina 404 senza layout
  { path: '404', component: NotFoundComponent },

  // Wildcard globale
  { path: '**', redirectTo: '404' }
];