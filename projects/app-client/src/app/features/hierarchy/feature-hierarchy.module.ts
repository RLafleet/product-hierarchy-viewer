import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProductHierarchyViewerModule } from 'product-hierarchy-viewer';
import { HierarchyPageComponent } from './hierarchy-page.component';

@NgModule({
  declarations: [HierarchyPageComponent],
  imports: [CommonModule, ProductHierarchyViewerModule],
  exports: [HierarchyPageComponent],
})
export class FeatureHierarchyModule {}
