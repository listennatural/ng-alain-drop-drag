import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SimpleGuard } from '@delon/auth';
import { environment } from '@env/environment';
// layout
import { LayoutDefaultComponent } from '../layout/default/default.component';
import { LayoutPassportComponent } from '../layout/passport/passport.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutDefaultComponent,
    // canActivate: [SimpleGuard],
    // canActivateChild: [SimpleGuard],
    children: [
      { path: '', redirectTo: 'system/main', pathMatch: 'full' },
      { path: '403', redirectTo: 'exception/403', pathMatch: 'full' },
      { path: '404', redirectTo: 'exception/404', pathMatch: 'full' },
      { path: '500', redirectTo: 'exception/500', pathMatch: 'full' },
      // 数据统计
      {
        path: 'system',
        loadChildren: () => import('./system/system.module').then(m => m.SystemModule),
      },
    ],
  },
  // 单页不包裹Layout
  { path: '**', redirectTo: 'exception/404' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: environment.useHash,
      // NOTICE: If you use `reuse-tab` component and turn on keepingScroll you can set to `disabled`
      // Pls refer to https://ng-alain.com/components/reuse-tab
      scrollPositionRestoration: 'top',
    }),
  ],
  exports: [RouterModule],
})
export class RouteRoutingModule {}
