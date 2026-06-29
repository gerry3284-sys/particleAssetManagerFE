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
//import { AssetStatusTypeListComponent } from './features/asset-status-type-list/asset-status-type-list';
import { BusinessUnitList } from './features/business-unit/business-unit-list';
import { TicketList } from './features/assets/pages/ticket-list/ticket-list';
import { AssetMaintenanceListComponent } from './features/assets/pages/asset-maintenance-list/asset-maintenance-list';
import { TicketDetail } from './features/assets/pages/ticket-detail/ticket-detail';
import { UserStandardTickets } from './features/area-user/user-standard-tickets/user-standard-tickets';
import { UserStandardTicketsDetail } from './features/area-user/user-standard-tickets-detail/user-standard-tickets-detail';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login — pubblico
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      { path: '', component: LoginComponent }
    ]
  },

  // Area utente standard — protetta
  {
    path: '', component: UserLayoutComponent,
    canActivate: [MsalGuard],
    children: [
      { path: 'user-standard/:oid', component: UserStandard },
      { path: 'user-standard/:oid/ticket', component: UserStandardTickets },
      { path: 'user-standard/:oid/ticket/ticket-detail/:ticketCode', component: UserStandardTicketsDetail }
    ]
  },

  // Area admin — protetta
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [MsalGuard],
    children: [
      { path: 'assets', component: AssetListComponent },
      { path: 'maintenance-assets', component: AssetMaintenanceListComponent },
      { path: 'assets/new', component: AssetCreateComponent },
      { path: 'assets/:assetCode', component: AssetDetailComponent },
      { path: 'asset-types', component: AssetTypeList },
      { path: 'businessUnits', component: BusinessUnitList },
      { path: 'tickets', component: TicketList },
      { path: 'tickets/ticket-detail/:ticketCode', component: TicketDetail },
      { path: 'users', component: UserList },
      { path: 'users/user-detail/:oid', component: UserDetail },
      { path: '', redirectTo: 'assets', pathMatch: 'full' }
    ]
  },

  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '404' }
];