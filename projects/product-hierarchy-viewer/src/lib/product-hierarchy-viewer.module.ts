import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProductHierarchyViewerComponent } from './product-hierarchy-viewer.component';

@NgModule({
  declarations: [
    ProductHierarchyViewerComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ProductHierarchyViewerComponent
  ]
})
export class ProductHierarchyViewerModule { }
