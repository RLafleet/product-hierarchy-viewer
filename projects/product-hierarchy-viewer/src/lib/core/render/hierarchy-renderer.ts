import { HierarchyLayout, ViewerConfig } from '../../models/hierarchy.models';

// Renderer draws the computed layout into a DOM/SVG container.
export interface HierarchyRenderer {
  initialize(container: HTMLElement): void;
  render(layout: HierarchyLayout, config: ViewerConfig): void;
  update(layout: HierarchyLayout, config: ViewerConfig): void;
  destroy(): void;
}
