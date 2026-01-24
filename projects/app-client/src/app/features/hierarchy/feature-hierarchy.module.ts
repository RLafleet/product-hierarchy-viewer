import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductHierarchyViewerModule } from 'product-hierarchy-viewer';
import { HierarchyPageComponent } from './hierarchy-page.component';

@NgModule({
  declarations: [HierarchyPageComponent],
  imports: [CommonModule, FormsModule, ProductHierarchyViewerModule],
  exports: [HierarchyPageComponent],
})
export class FeatureHierarchyModule {}
