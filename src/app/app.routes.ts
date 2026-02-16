import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layout/auth-layout/auth-layout';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout';
import { AssetListComponent } from './features/assets/pages/asset-list/asset-list';
import { UserList } from './features/users/pages/user-list/user-list';
import { Login } from './features/auth/login/login';
import { UserDetail } from './features/user-detail/user-detail';
import { UserStandard } from './features/area-user/user-standard/user-standard';
import { UserLayoutComponent } from './core/layout/user-layout/user-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'user-standard/:id', pathMatch: 'full' },
  {
    path: 'login',
    component: AuthLayoutComponent, // <- qui
    children: [
      { path: '', component: Login }
    ]
  },
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
      //route temporanea per rendermi piu facile lavorare su user-standard
      { path: 'assets', component: AssetListComponent },
      { path: 'assets/new', redirectTo: 'assets', pathMatch: 'full' },
      { path: 'assets/:id', redirectTo: 'assets', pathMatch: 'full' },
      { path: 'users', component: UserList },
      { path: 'users/user-detail/:id', component: UserDetail },
      { path: '', redirectTo: 'assets', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
