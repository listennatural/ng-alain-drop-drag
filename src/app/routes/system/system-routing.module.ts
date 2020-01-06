import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemMainComponent } from './system-main/system-main.component';

const routes: Routes = [{ path: 'main', component: SystemMainComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SystemRoutingModule {}
