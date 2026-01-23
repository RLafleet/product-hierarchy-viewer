// Shared contracts for the hierarchy viewer library.
export interface HierarchyNode {
  id: string;
  parentId: string | null;
  name: string;
  type: string;
  status?: string;
  deadline?: string; // ISO string
  isLeaf?: boolean;
  children?: HierarchyNode[];
  meta?: Record<string, unknown>;
}

export interface ViewerConfig {
  initialDepth?: number; // how many levels to expand on load
  maxDepth?: number; // maximum allowed depth
  enableAnimations?: boolean;
  enablePanZoom?: boolean;
  nodeStyles?: NodeStyleConfig; // styles by status/type
}

export interface NodeStyleConfig {
  [statusOrType: string]: {
    color?: string;
    borderColor?: string;
    icon?: string;
  };
}

export interface NodeUpdate {
  nodeId: string;
  changes: Partial<HierarchyNode>;
}

// Layout output used by renderers and interaction layers.
export interface LayoutNode {
  id: string;
  depth: number;
  x: number;
  y: number;
  data: HierarchyNode;
}

export interface LayoutLink {
  source: LayoutNode;
  target: LayoutNode;
}

export interface HierarchyLayout {
  nodes: LayoutNode[];
  links: LayoutLink[];
}
