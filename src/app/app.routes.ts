import { Routes } from '@angular/router';
import { AuthLayout } from './core/layout/auth-layout/auth-layout';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { AssetList } from './features/assets/pages/asset-list/asset-list';
import { UserList } from './features/users/pages/user-list/user-list';
import { Login } from './features/auth/login/login';
import { UserDetails } from './features/users/pages/user-list/user-details/user-details';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthLayoutComponent, // <- qui
    children: [
      { path: '', component: Login }
    ]
  },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'assets', component: AssetList },
      { path: 'users', component: UserList,
      children:[
        { path: 'user-details/:id', component: UserDetails },
      ]
      },
      { path: '', redirectTo: 'assets', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'assets' }
];
