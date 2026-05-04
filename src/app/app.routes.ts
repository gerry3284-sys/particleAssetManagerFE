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
// import { AssetStatusTypeListComponent } from './features/asset-status-type-list/asset-status-type-list';
import { TicketList } from './features/assets/pages/ticket-list/ticket-list';
import { TicketDetail } from './features/assets/pages/ticket-detail/ticket-detail';
import { UserStandardTickets } from './features/area-user/user-standard-tickets/user-standard-tickets';
import { UserStandardTicketsDetail } from './features/area-user/user-standard-tickets-detail/user-standard-tickets-detail';

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
  
  {
    path: '', component: UserLayoutComponent,
    children: [
      { path: 'user-standard/:oid', component: UserStandard },
      { path: 'user-standard/:oid/ticket', component: UserStandardTickets },
      { path: 'user-standard/:oid/ticket/ticket-detail/:ticketCode', component: UserStandardTicketsDetail }
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
      { path: 'assets/:assetCode', component: AssetDetailComponent },
      { path: 'asset-types', component: AssetTypeList},
      // { path: 'asset-status-types', component: AssetStatusTypeListComponent },
      // BusinessUnit
      { path: 'businessUnits', component: BusinessUnitList},
      //tickets
      { path: 'tickets', component: TicketList },
      { path: 'tickets/ticket-detail/:ticketCode', component: TicketDetail },
      // Users
      { path: 'users', component: UserList },
      { path: 'users/user-detail/:oid', component: UserDetail },
      { path: '', redirectTo: 'assets', pathMatch: 'full' }
    ]
  },
  
  // Pagina 404 senza layout
  { path: '404', component: NotFoundComponent },

  // Wildcard globale
  { path: '**', redirectTo: '404' }
];