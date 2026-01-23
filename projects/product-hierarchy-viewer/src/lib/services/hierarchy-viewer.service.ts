import { Injectable } from '@angular/core';
import { D3HierarchyViewer } from '../core/d3-hierarchy-viewer';
import { HierarchyViewerCore } from '../core/hierarchy-viewer-core';
import { InteractionCallbacks } from '../core/interaction/interaction-controller';
import { HierarchyNode, ViewerConfig } from '../models/hierarchy.models';

// Angular-facing factory for the viewer core and D3 adapter.
@Injectable({
  providedIn: 'root',
})
export class HierarchyViewerService {
  create(
    container: HTMLElement,
    data: HierarchyNode[],
    config: ViewerConfig,
    callbacks: InteractionCallbacks
  ): HierarchyViewerCore {
    const d3Adapter = new D3HierarchyViewer();
    const core = new HierarchyViewerCore({
      layoutEngine: d3Adapter,
      renderer: d3Adapter,
      interactionController: d3Adapter,
    });

    core.initialize(container, data, config, callbacks);

    return core;
  }

  focus(core: HierarchyViewerCore, nodeId: string | null): void {
    core.focusNode(nodeId);
  }
}
