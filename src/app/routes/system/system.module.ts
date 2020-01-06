import { NgModule } from '@angular/core';
import { SharedModule } from '@shared';
import { SystemRoutingModule } from './system-routing.module';
import { SystemMainComponent } from './system-main/system-main.component';

const COMPONENTS = [SystemMainComponent];
const COMPONENTS_NOROUNT = [];

@NgModule({
  imports: [SharedModule, SystemRoutingModule],
  declarations: [...COMPONENTS, ...COMPONENTS_NOROUNT],
  entryComponents: COMPONENTS_NOROUNT,
})
export class SystemModule {}
