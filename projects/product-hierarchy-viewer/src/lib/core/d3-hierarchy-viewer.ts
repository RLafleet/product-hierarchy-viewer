import { InteractionCallbacks, InteractionController } from './interaction/interaction-controller';
import { HierarchyLayoutEngine } from './layout/layout-engine';
import { HierarchyRenderer } from './render/hierarchy-renderer';
import {
  HierarchyLayout,
  HierarchyNode,
  LayoutLink,
  LayoutNode,
  NodeUpdate,
  ViewerConfig,
} from '../models/hierarchy.models';

const VIRTUAL_ROOT_ID = '__virtual_root__';
const NODE_GAP_Y = 80;
const NODE_GAP_X = 220;
const VIEW_MARGIN = 40;
const SVG_NS = 'http://www.w3.org/2000/svg';

type SvgNodeElement = SVGGElement & { __phvNode?: LayoutNode };

// SVG/DOM-backed adapter that handles layout, rendering, and interaction.
export class D3HierarchyViewer
  implements HierarchyLayoutEngine, HierarchyRenderer, InteractionController
{
  private container: HTMLElement | null = null;
  private svg: SVGSVGElement | null = null;
  private zoomLayer: SVGGElement | null = null;
  private linksGroup: SVGGElement | null = null;
  private nodesGroup: SVGGElement | null = null;
  private callbacks: InteractionCallbacks = {};
  private collapsedNodeIds = new Set<string>();
  private selectedNodeId: string | null = null;
  private hasAppliedInitialDepth = false;
  private latestConfig: ViewerConfig = {};
  private latestData: HierarchyNode[] = [];
  private zoomState = { x: 0, y: 0, scale: 1 };
  private isPanning = false;
  private panStart: { x: number; y: number } | null = null;
  private panOrigin: { x: number; y: number } = { x: 0, y: 0 };
  private panZoomEnabled = false;
  private onWheelHandler?: (event: WheelEvent) => void;
  private onMouseDownHandler?: (event: MouseEvent) => void;
  private onMouseMoveHandler?: (event: MouseEvent) => void;
  private onMouseUpHandler?: (event: MouseEvent) => void;

  initialize(container: HTMLElement, callbacks?: InteractionCallbacks): void {
    this.container = container;
    if (callbacks) {
      this.callbacks = callbacks;
    }

    if (!this.svg) {
      this.svg = this.createSvgElement('svg');
      this.svg.classList.add('phv-svg');
      this.svg.style.width = '100%';
      this.svg.style.height = '100%';
      this.svg.style.display = 'block';

      this.zoomLayer = this.createSvgElement('g');
      this.zoomLayer.setAttribute('class', 'phv-zoom-layer');

      this.linksGroup = this.createSvgElement('g');
      this.linksGroup.setAttribute('class', 'phv-links');

      this.nodesGroup = this.createSvgElement('g');
      this.nodesGroup.setAttribute('class', 'phv-nodes');

      this.zoomLayer.appendChild(this.linksGroup);
      this.zoomLayer.appendChild(this.nodesGroup);
      this.svg.appendChild(this.zoomLayer);
      container.appendChild(this.svg);
    }
  }

  layout(data: HierarchyNode[], config: ViewerConfig): HierarchyLayout {
    this.latestData = data ?? [];
    this.latestConfig = config ?? {};

    const normalized = this.normalizeData(this.latestData);
    this.applyInitialDepth(normalized, this.latestConfig.initialDepth);

    const renderable = this.buildRenderableTree(
      normalized,
      0,
      this.latestConfig.maxDepth
    );
    const rootData: HierarchyNode = {
      id: VIRTUAL_ROOT_ID,
      parentId: null,
      name: 'ROOT',
      type: 'root',
      children: renderable,
    };

    const positions = new Map<string, LayoutNode>();
    let nextX = 0;

    const consumeNextX = (): number => {
      const current = nextX;
      nextX += NODE_GAP_Y;
      return current;
    };

    const layoutNode = (node: HierarchyNode, depth: number): number => {
      const children = node.children ?? [];
      const childXs = children.map((child) => layoutNode(child, depth + 1));
      const x =
        childXs.length === 0
          ? consumeNextX()
          : (Math.min(...childXs) + Math.max(...childXs)) / 2;
      const y = depth * NODE_GAP_X;

      positions.set(node.id, {
        id: node.id,
        depth,
        x,
        y,
        data: node,
      });

      return x;
    };

    layoutNode(rootData, -1);

    const nodes: LayoutNode[] = [];
    positions.forEach((node) => {
      if (node.id !== VIRTUAL_ROOT_ID) {
        nodes.push(node);
      }
    });

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const links: LayoutLink[] = [];

    const buildLinks = (node: HierarchyNode, parentId: string | null): void => {
      if (parentId && parentId !== VIRTUAL_ROOT_ID && node.id !== VIRTUAL_ROOT_ID) {
        const source = nodeById.get(parentId);
        const target = nodeById.get(node.id);
        if (source && target) {
          links.push({ source, target });
        }
      }
      (node.children ?? []).forEach((child) => buildLinks(child, node.id));
    };

    buildLinks(rootData, null);

    return { nodes, links };
  }

  render(layout: HierarchyLayout, config: ViewerConfig): void {
    this.updateSize();
    this.configurePanZoom(config);
    this.renderLinks(layout);
    this.renderNodes(layout, config);
  }

  update(layout: HierarchyLayout, config: ViewerConfig): void {
    this.render(layout, config);
  }

  destroy(): void {
    this.detachPanZoomHandlers();
    this.svg?.remove();
    this.svg = null;
    this.zoomLayer = null;
    this.linksGroup = null;
    this.nodesGroup = null;
    this.container = null;
  }

  bind(layout: HierarchyLayout): void {
    if (!this.nodesGroup) {
      return;
    }

    const nodeElements = Array.from(
      this.nodesGroup.querySelectorAll<SVGGElement>('g.phv-node')
    );

    nodeElements.forEach((element) => {
      const node = (element as SvgNodeElement).__phvNode;
      if (!node) {
        return;
      }

      element.onclick = () => {
        this.selectedNodeId = node.id;
        this.updateSelection();
        this.callbacks.onNodeSelected?.(node.data);
      };

      element.ondblclick = () => {
        this.toggleNode(node.data);
        this.callbacks.onNodeToggled?.(node.data);
      };

      element.oncontextmenu = (event) => {
        event.preventDefault();
        const update: NodeUpdate = {
          nodeId: node.id,
          changes: {
            meta: {
              ...(node.data.meta ?? {}),
              lastEditedAt: new Date().toISOString(),
            },
          },
        };
        this.callbacks.onNodeUpdated?.(update);
      };
    });

    this.updateSelection();
  }

  private renderLinks(layout: HierarchyLayout): void {
    if (!this.linksGroup) {
      return;
    }

    this.linksGroup.replaceChildren();
    const fragment = document.createDocumentFragment();

    layout.links.forEach((link) => {
      const path = this.createSvgElement('path');
      path.setAttribute('class', 'phv-link');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#9aa5b1');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('d', this.buildLinkPath(link));
      fragment.appendChild(path);
    });

    this.linksGroup.appendChild(fragment);
  }

  private renderNodes(layout: HierarchyLayout, config: ViewerConfig): void {
    if (!this.nodesGroup) {
      return;
    }

    this.nodesGroup.replaceChildren();
    const fragment = document.createDocumentFragment();

    layout.nodes.forEach((node, index) => {
      const nodeElement = this.createSvgElement('g') as SvgNodeElement;
      nodeElement.setAttribute('class', 'phv-node');
      nodeElement.setAttribute(
        'transform',
        `translate(${node.y + VIEW_MARGIN},${node.x + VIEW_MARGIN})`
      );
      nodeElement.style.setProperty('--pop-delay', `${index * 40}ms`);
      nodeElement.__phvNode = node;
      nodeElement.classList.toggle('is-selected', node.id === this.selectedNodeId);

      const visual = this.createSvgElement('g');
      visual.setAttribute('class', 'phv-node-visual');

      const circle = this.createSvgElement('circle');
      circle.setAttribute('r', '12');
      circle.setAttribute('stroke-width', '2.5');

      const text = this.createSvgElement('text');
      text.setAttribute('x', '16');
      text.setAttribute('y', '4');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#1f2933');
      text.textContent = node.data.name;

      const style = this.resolveNodeStyle(node.data, config);
      circle.setAttribute('fill', style.color);
      circle.setAttribute('stroke', style.borderColor);

      visual.appendChild(circle);
      visual.appendChild(text);
      nodeElement.appendChild(visual);
      fragment.appendChild(nodeElement);
    });

    this.nodesGroup.appendChild(fragment);
  }

  private updateSize(): void {
    if (!this.svg || !this.container) {
      return;
    }

    const bounds = this.container.getBoundingClientRect();
    const width = Math.max(bounds.width, 600);
    const height = Math.max(bounds.height, 400);

    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  private configurePanZoom(config: ViewerConfig): void {
    const enablePanZoom = config.enablePanZoom ?? true;
    if (!this.svg || !this.zoomLayer) {
      return;
    }

    if (enablePanZoom) {
      this.attachPanZoomHandlers();
    } else {
      this.detachPanZoomHandlers();
    }

    this.applyTransform();
  }

  private attachPanZoomHandlers(): void {
    if (!this.svg || this.panZoomEnabled) {
      return;
    }

    this.panZoomEnabled = true;

    this.onWheelHandler = (event) => {
      if (!this.svg || !this.panZoomEnabled) {
        return;
      }
      event.preventDefault();

      const rect = this.svg.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const direction = event.deltaY < 0 ? 1.1 : 0.9;
      const nextScale = this.clampScale(this.zoomState.scale * direction);
      const scaleRatio = nextScale / this.zoomState.scale;

      this.zoomState.x = pointerX - (pointerX - this.zoomState.x) * scaleRatio;
      this.zoomState.y = pointerY - (pointerY - this.zoomState.y) * scaleRatio;
      this.zoomState.scale = nextScale;

      this.applyTransform();
    };

    this.onMouseDownHandler = (event) => {
      if (event.button !== 0) {
        return;
      }
      this.isPanning = true;
      this.panStart = { x: event.clientX, y: event.clientY };
      this.panOrigin = { x: this.zoomState.x, y: this.zoomState.y };
    };

    this.onMouseMoveHandler = (event) => {
      if (!this.isPanning || !this.panStart) {
        return;
      }
      this.zoomState.x = this.panOrigin.x + (event.clientX - this.panStart.x);
      this.zoomState.y = this.panOrigin.y + (event.clientY - this.panStart.y);
      this.applyTransform();
    };

    this.onMouseUpHandler = () => {
      this.isPanning = false;
      this.panStart = null;
    };

    this.svg.addEventListener('wheel', this.onWheelHandler, { passive: false });
    this.svg.addEventListener('mousedown', this.onMouseDownHandler);
    window.addEventListener('mousemove', this.onMouseMoveHandler);
    window.addEventListener('mouseup', this.onMouseUpHandler);
  }

  private detachPanZoomHandlers(): void {
    if (!this.svg || !this.panZoomEnabled) {
      return;
    }

    if (this.onWheelHandler) {
      this.svg.removeEventListener('wheel', this.onWheelHandler);
    }
    if (this.onMouseDownHandler) {
      this.svg.removeEventListener('mousedown', this.onMouseDownHandler);
    }
    if (this.onMouseMoveHandler) {
      window.removeEventListener('mousemove', this.onMouseMoveHandler);
    }
    if (this.onMouseUpHandler) {
      window.removeEventListener('mouseup', this.onMouseUpHandler);
    }

    this.onWheelHandler = undefined;
    this.onMouseDownHandler = undefined;
    this.onMouseMoveHandler = undefined;
    this.onMouseUpHandler = undefined;
    this.panZoomEnabled = false;
    this.isPanning = false;
    this.panStart = null;
  }

  private applyTransform(): void {
    if (!this.zoomLayer) {
      return;
    }

    this.zoomLayer.setAttribute(
      'transform',
      `translate(${this.zoomState.x} ${this.zoomState.y}) scale(${this.zoomState.scale})`
    );
  }

  private clampScale(scale: number): number {
    return Math.min(2.5, Math.max(0.2, scale));
  }

  private updateSelection(): void {
    if (!this.nodesGroup) {
      return;
    }

    const nodeElements = Array.from(
      this.nodesGroup.querySelectorAll<SVGGElement>('g.phv-node')
    );
    nodeElements.forEach((element) => {
      const node = (element as SvgNodeElement).__phvNode;
      if (!node) {
        return;
      }
      element.classList.toggle('is-selected', node.id === this.selectedNodeId);
    });
  }

  private buildLinkPath(link: LayoutLink): string {
    const startX = link.source.y + VIEW_MARGIN;
    const startY = link.source.x + VIEW_MARGIN;
    const endX = link.target.y + VIEW_MARGIN;
    const endY = link.target.x + VIEW_MARGIN;
    const midX = (startX + endX) / 2;

    return `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`;
  }

  private toggleNode(node: HierarchyNode): void {
    if (this.collapsedNodeIds.has(node.id)) {
      this.collapsedNodeIds.delete(node.id);
    } else {
      this.collapsedNodeIds.add(node.id);
    }
  }

  private applyInitialDepth(nodes: HierarchyNode[], initialDepth?: number): void {
    if (this.hasAppliedInitialDepth || initialDepth === undefined) {
      return;
    }

    const visit = (node: HierarchyNode, depth: number): void => {
      if (depth >= initialDepth) {
        this.collapsedNodeIds.add(node.id);
        return;
      }
      (node.children ?? []).forEach((child) => visit(child, depth + 1));
    };

    nodes.forEach((node) => visit(node, 0));
    this.hasAppliedInitialDepth = true;
  }

  private normalizeData(data: HierarchyNode[]): HierarchyNode[] {
    const hasChildren = data.some((node) => Array.isArray(node.children));

    if (hasChildren) {
      return data.map((node) => this.cloneNode(node));
    }

    return this.buildTreeFromFlat(data);
  }

  private buildTreeFromFlat(data: HierarchyNode[]): HierarchyNode[] {
    const nodesById = new Map<string, HierarchyNode>();

    data.forEach((node) => {
      nodesById.set(node.id, { ...node, children: [] });
    });

    const roots: HierarchyNode[] = [];

    nodesById.forEach((node) => {
      if (node.parentId && nodesById.has(node.parentId)) {
        nodesById.get(node.parentId)?.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private buildRenderableTree(
    nodes: HierarchyNode[],
    depth: number,
    maxDepth?: number
  ): HierarchyNode[] {
    return nodes.map((node) => {
      const isCollapsed = this.collapsedNodeIds.has(node.id);
      const allowChildren = !isCollapsed && (maxDepth === undefined || depth < maxDepth);
      const children = allowChildren
        ? this.buildRenderableTree(node.children ?? [], depth + 1, maxDepth)
        : [];

      return {
        ...node,
        children,
      };
    });
  }

  private cloneNode(node: HierarchyNode): HierarchyNode {
    const children = (node.children ?? []).map((child) => this.cloneNode(child));
    return {
      ...node,
      children,
    };
  }

  private resolveNodeStyle(node: HierarchyNode, config: ViewerConfig): {
    color: string;
    borderColor: string;
  } {
    const byStatus = node.status ? config.nodeStyles?.[node.status] : undefined;
    const byType = config.nodeStyles?.[node.type];
    const style = byStatus ?? byType ?? {};

    return {
      color: style.color ?? '#5b8def',
      borderColor: style.borderColor ?? '#1c2d4a',
    };
  }

  private createSvgElement<T extends keyof SVGElementTagNameMap>(
    tag: T
  ): SVGElementTagNameMap[T] {
    return document.createElementNS(SVG_NS, tag);
  }
}
