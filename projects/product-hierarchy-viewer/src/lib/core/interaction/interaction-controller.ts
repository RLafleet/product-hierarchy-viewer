import { HierarchyLayout, HierarchyNode, NodeUpdate } from '../../models/hierarchy.models';

// Interaction layer handles input events and reports node-level actions.
export interface InteractionCallbacks {
  onNodeSelected?: (node: HierarchyNode) => void;
  onNodeToggled?: (node: HierarchyNode) => void;
  onNodeUpdated?: (update: NodeUpdate) => void;
}

export interface InteractionController {
  initialize(container: HTMLElement, callbacks: InteractionCallbacks): void;
  bind(layout: HierarchyLayout): void;
  destroy(): void;
  focusNode?(nodeId: string | null): void;
}
