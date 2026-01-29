import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layout/auth-layout/auth-layout';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout';
import { AssetListComponent } from './features/assets/pages/asset-list/asset-list';
import { UserList } from './features/users/pages/user-list/user-list';
import { Login } from './features/auth/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: AuthLayoutComponent, // <- qui
    children: [
      { path: '', component: Login }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'assets', component: AssetListComponent },
      { path: 'users', component: UserList },
      { path: '', redirectTo: 'assets', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
