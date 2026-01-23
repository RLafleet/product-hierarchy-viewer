import { InteractionCallbacks, InteractionController } from './interaction/interaction-controller';
import { HierarchyLayoutEngine } from './layout/layout-engine';
import { HierarchyRenderer } from './render/hierarchy-renderer';
import { HierarchyNode, ViewerConfig } from '../models/hierarchy.models';

// Core orchestrates layout, rendering, and interaction without direct D3 coupling.
export interface HierarchyViewerAdapters {
  layoutEngine: HierarchyLayoutEngine;
  renderer: HierarchyRenderer;
  interactionController: InteractionController;
}

export class HierarchyViewerCore {
  private container: HTMLElement | null = null;
  private data: HierarchyNode[] = [];
  private config: ViewerConfig = {};
  private isRendered = false;
  private callbacks: InteractionCallbacks = {};

  constructor(private readonly adapters: HierarchyViewerAdapters) {}

  initialize(
    container: HTMLElement,
    data: HierarchyNode[],
    config: ViewerConfig,
    callbacks: InteractionCallbacks
  ): void {
    this.container = container;
    this.data = data ?? [];
    this.config = config ?? {};
    this.callbacks = this.wrapCallbacks(callbacks);

    this.adapters.renderer.initialize(container);
    this.adapters.interactionController.initialize(container, this.callbacks);
    this.refresh();
  }

  update(data?: HierarchyNode[], config?: ViewerConfig): void {
    if (data) {
      this.data = data;
    }
    if (config) {
      this.config = config;
    }
    this.refresh();
  }

  destroy(): void {
    this.adapters.interactionController.destroy();
    this.adapters.renderer.destroy();
    this.container = null;
    this.isRendered = false;
  }

  focusNode(nodeId: string | null): void {
    this.adapters.interactionController.focusNode?.(nodeId);
  }

  private wrapCallbacks(callbacks: InteractionCallbacks): InteractionCallbacks {
    return {
      onNodeSelected: (node) => callbacks.onNodeSelected?.(node),
      onNodeToggled: (node) => {
        callbacks.onNodeToggled?.(node);
        this.refresh();
      },
      onNodeUpdated: (update) => callbacks.onNodeUpdated?.(update),
    };
  }

  private refresh(): void {
    if (!this.container) {
      return;
    }

    const layout = this.adapters.layoutEngine.layout(this.data, this.config);

    if (!this.isRendered) {
      this.adapters.renderer.render(layout, this.config);
      this.isRendered = true;
    } else {
      this.adapters.renderer.update(layout, this.config);
    }

    this.adapters.interactionController.bind(layout);
  }
}
