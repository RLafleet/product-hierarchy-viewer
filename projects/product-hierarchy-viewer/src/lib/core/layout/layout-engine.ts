import { HierarchyLayout, HierarchyNode, ViewerConfig } from '../../models/hierarchy.models';

// Layout engine computes coordinates and links for the hierarchy tree.
export interface HierarchyLayoutEngine {
  layout(data: HierarchyNode[], config: ViewerConfig): HierarchyLayout;
}
