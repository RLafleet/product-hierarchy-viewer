import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HierarchyNode, NodeUpdate, ViewerConfig } from 'product-hierarchy-viewer';
import { MOCK_HIERARCHY } from '../../mock/mock-hierarchy';

interface Summary {
  total: number;
  details: number;
  active: number;
  inProgress: number;
  blocked: number;
  waiting: number;
  done: number;
  dueSoon: number;
  overdue: number;
  completionPct: number;
}

@Component({
  selector: 'app-hierarchy-page',
  templateUrl: './hierarchy-page.component.html',
  styleUrls: ['./hierarchy-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchyPageComponent {
  data: HierarchyNode[] = MOCK_HIERARCHY;
  searchTerm = '';

  // Главные объекты (машины/платформы)
  private readonly mainTypes = new Set(['product', 'platform']);

  config: ViewerConfig = {
    initialDepth: 2,
    enablePanZoom: true,
    enableAnimations: true,
    nodeStyles: {
      active: { color: '#e7f7f5', borderColor: '#0f766e' },
      'in-progress': { color: '#fff1e6', borderColor: '#b45309' },
      blocked: { color: '#fde8e8', borderColor: '#b42318' },
      review: { color: '#f6efe5', borderColor: '#7c4a28' },
      waiting: { color: '#eef2f6', borderColor: '#475569' },
      done: { color: '#e7f8ef', borderColor: '#15803d' },
      area: { color: '#e0f2fe', borderColor: '#0ea5e9' },
      product: { color: '#eef2ff', borderColor: '#4338ca' },
      assembly: { color: '#fef3c7', borderColor: '#d97706' },
      part: { color: '#f4f4f5', borderColor: '#1f2937' },
      platform: { color: '#ecfeff', borderColor: '#0891b2' },
    },
  };

  statusLabels: Record<string, string> = {
    active: 'Активно',
    'in-progress': 'В работе',
    blocked: 'Блок',
    review: 'Проверка',
    waiting: 'Ожидание',
    done: 'Готово',
  };

  typeLabels: Record<string, string> = {
    area: 'Цех',
    product: 'Машина',
    assembly: 'Узел',
    part: 'Деталь',
    platform: 'Платформа',
    root: 'Корень',
  };

  selectedNode: HierarchyNode | null = null;
  selectedPath = '';
  focusNodeId: string | null = null;
  selectedMainId: string | null = null;

  private flatNodes: HierarchyNode[] = this.flattenNodes(this.data);

  constructor() {
    const firstMain = this.mainObjects[0] ?? this.flatNodes[0];
    if (firstMain) {
      this.selectedMainId = firstMain.id;
      this.selectedNode = firstMain;
      this.focusNodeId = firstMain.id;
      this.selectedPath = this.buildPath(firstMain.id);
    }
  }

  get summary(): Summary {
    return this.buildSummary(this.flatNodes);
  }

  get mainObjects(): HierarchyNode[] {
    return this.flatNodes.filter((node) => this.mainTypes.has(node.type));
  }

  // Частичное дерево — только выбранный главный объект
  get treeData(): HierarchyNode[] {
    if (this.selectedMainId) {
      const root = this.findNode(this.selectedMainId, this.data);
      if (root) {
        return [root];
      }
    }
    const fallback = this.mainObjects[0];
    return fallback ? [fallback] : this.data;
  }

  // Карта главных объектов (машины/платформы)
  get mainGroups(): Array<{ shop: string; items: HierarchyNode[] }> {
    const q = this.searchTerm.trim().toLowerCase();
    const map = new Map<string, HierarchyNode[]>();

    this.mainObjects.forEach((node) => {
      if (
        q &&
        !node.name.toLowerCase().includes(q) &&
        !node.id.toLowerCase().includes(q)
      ) {
        return;
      }
      const shop = (node.meta?.['shop'] as string) || 'Без цеха';
      if (!map.has(shop)) {
        map.set(shop, []);
      }
      map.get(shop)?.push(node);
    });

    return Array.from(map.entries()).map(([shop, items]) => ({ shop, items }));
  }

  // Карта критичных деталей (листья, не главные объекты)
  get criticalDetailsGroups(): Array<{ shop: string; items: HierarchyNode[] }> {
    const q = this.searchTerm.trim().toLowerCase();
    const map = new Map<string, HierarchyNode[]>();

    this.flatNodes
      .filter(
        (n) =>
          !this.mainTypes.has(n.type) &&
          (n.isLeaf || !n.children?.length) &&
          n.meta?.['critical'] === 'true'
      )
      .forEach((node) => {
        if (
          q &&
          !node.name.toLowerCase().includes(q) &&
          !node.id.toLowerCase().includes(q)
        ) {
          return;
        }
        const shop = (node.meta?.['shop'] as string) || 'Без цеха';
        if (!map.has(shop)) {
          map.set(shop, []);
        }
        map.get(shop)?.push(node);
      });

    return Array.from(map.entries()).map(([shop, items]) => ({ shop, items }));
  }

  onNodeSelected(node: HierarchyNode): void {
    this.selectedNode = node;
    this.focusNodeId = node.id;
    this.selectedPath = this.buildPath(node.id);
  }

  onNodeToggled(node: HierarchyNode): void {
    this.selectedNode = node;
    this.focusNodeId = node.id;
    this.selectedPath = this.buildPath(node.id);
  }

  onNodeUpdated(update: NodeUpdate): void {
    console.info('Изменение узла', update);
  }

  // Переходы из карт: если кликнули деталь — поднимаемся к главному предку и переключаем дерево
  jumpToNode(nodeId: string): void {
    const target = this.flatNodes.find((node) => node.id === nodeId);
    if (target) {
      if (this.mainTypes.has(target.type)) {
        this.selectedMainId = target.id;
      } else {
        const mainAncestor = this.findMainAncestor(target);
        this.selectedMainId = mainAncestor?.id ?? this.selectedMainId;
      }
      this.selectedNode = target;
      this.focusNodeId = target.id;
      this.selectedPath = this.buildPath(target.id);
      this.scrollToPartialTree();
    }
  }

  statusClass(status?: string): string {
    return `status-${status ?? 'unknown'}`;
  }

  getStatusLabel(status?: string): string {
    if (!status) {
      return 'Неизвестно';
    }
    return this.statusLabels[status] ?? status;
  }

  getTypeLabel(type?: string): string {
    if (!type) {
      return 'Неизвестно';
    }
    return this.typeLabels[type] ?? type;
  }

  getMeta(node: HierarchyNode, key: string): string | undefined {
    const value = node.meta?.[key];
    return typeof value === 'string' ? value : undefined;
  }

  formatDeadline(deadline?: string): string {
    if (!deadline) {
      return '—';
    }
    const parsed = new Date(deadline);
    if (Number.isNaN(parsed.getTime())) {
      return deadline;
    }
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  }

  formatCost(cost: unknown): string {
    const value =
      typeof cost === 'number'
        ? cost
        : typeof cost === 'string'
          ? Number(cost.replace(/\s/g, '').replace(',', '.'))
          : NaN;
    if (!Number.isFinite(value)) {
      return '—';
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private scrollToPartialTree(): void {
    setTimeout(() => {
      document.getElementById('partial-tree')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  private flattenNodes(nodes: HierarchyNode[]): HierarchyNode[] {
    const acc: HierarchyNode[] = [];
    const walk = (list: HierarchyNode[]): void => {
      list.forEach((node) => {
        acc.push(node);
        if (node.children?.length) {
          walk(node.children);
        }
      });
    };
    walk(nodes);
    return acc;
  }

  private findNode(id: string, nodes: HierarchyNode[]): HierarchyNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children?.length) {
        const found = this.findNode(id, node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private findMainAncestor(node: HierarchyNode): HierarchyNode | null {
    const map = new Map(this.flatNodes.map((n) => [n.id, n]));
    let current: HierarchyNode | undefined | null = node;
    while (current) {
      if (this.mainTypes.has(current.type)) {
        return current;
      }
      current = current.parentId ? map.get(current.parentId) : null;
    }
    return null;
  }

  private buildPath(nodeId: string): string {
    const index = new Map(this.flatNodes.map((node) => [node.id, node]));
    const path: string[] = [];
    let cursor: HierarchyNode | undefined | null = index.get(nodeId);

    while (cursor) {
      path.unshift(cursor.name);
      if (!cursor.parentId) {
        break;
      }
      cursor = index.get(cursor.parentId);
    }

    return path.join(' / ');
  }

  private buildSummary(nodes: HierarchyNode[]): Summary {
    const now = new Date();
    const soonThreshold = new Date(now);
    soonThreshold.setDate(now.getDate() + 7);

    const summary: Summary = {
      total: 0,
      details: 0,
      active: 0,
      inProgress: 0,
      blocked: 0,
      waiting: 0,
      done: 0,
      dueSoon: 0,
      overdue: 0,
      completionPct: 0,
    };

    nodes.forEach((node) => {
      summary.total += 1;
      const isLeaf = node.isLeaf || !node.children?.length;
      if (isLeaf) {
        summary.details += 1;
      }
      switch (node.status) {
        case 'active':
          summary.active += 1;
          break;
        case 'in-progress':
          summary.inProgress += 1;
          break;
        case 'blocked':
          summary.blocked += 1;
          break;
        case 'waiting':
          summary.waiting += 1;
          break;
        case 'done':
          summary.done += 1;
          break;
        default:
          break;
      }

      if (node.deadline) {
        const d = new Date(node.deadline);
        if (!Number.isNaN(d.getTime())) {
          if (d < now && node.status !== 'done') {
            summary.overdue += 1;
          } else if (d >= now && d <= soonThreshold && node.status !== 'done') {
            summary.dueSoon += 1;
          }
        }
      }
    });

    summary.completionPct = summary.total ? Math.round((summary.done / summary.total) * 100) : 0;
    return summary;
  }
}
