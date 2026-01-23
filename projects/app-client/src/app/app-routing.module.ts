import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HierarchyPageComponent } from './features/hierarchy/hierarchy-page.component';

const routes: Routes = [
  {
    path: '',
    component: HierarchyPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
