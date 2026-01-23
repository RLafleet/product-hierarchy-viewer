import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HierarchyNode,
  NodeUpdate,
  ViewerConfig,
} from 'product-hierarchy-viewer';
import { MOCK_HIERARCHY } from '../../mock/mock-hierarchy';

interface HierarchySummary {
  total: number;
  leaves: number;
  active: number;
  inProgress: number;
  blocked: number;
  review: number;
  done: number;
  waiting: number;
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
    blocked: 'Заблокировано',
    review: 'На проверке',
    waiting: 'В ожидании',
    done: 'Готово',
  };

  typeLabels: Record<string, string> = {
    area: 'Цех / участок',
    product: 'Изделие',
    assembly: 'Узел',
    part: 'Деталь',
    platform: 'Платформа',
    root: 'Корень',
  };

  dashboardConfig: Array<{ key: keyof HierarchySummary; label: string; color: string }> = [
    { key: 'active', label: 'Активно', color: '#0f766e' },
    { key: 'inProgress', label: 'В работе', color: '#0284c7' },
    { key: 'blocked', label: 'Блокеры', color: '#b42318' },
    { key: 'review', label: 'На проверке', color: '#7c4a28' },
    { key: 'waiting', label: 'Ожидает', color: '#475569' },
    { key: 'done', label: 'Готово', color: '#15803d' },
  ];

  selectedNode: HierarchyNode | null = null;
  selectedPath = '';
  focusNodeId: string | null = null;

  private flatNodes: HierarchyNode[] = this.flattenNodes(this.data);
  summary: HierarchySummary = this.buildSummary(this.flatNodes);

  constructor() {
    const first = this.flatNodes[0];
    if (first) {
      this.selectedNode = first;
      this.focusNodeId = first.id;
      this.selectedPath = this.buildPath(first.id);
    }
  }

  get detailMap(): HierarchyNode[] {
    return this.flatNodes
      .filter((node) => node.parentId !== null && (node.isLeaf || !node.children?.length))
      .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''));
  }

  get scopedSummary(): HierarchySummary {
    if (this.selectedNode) {
      return this.buildSummary(this.getSubtreeNodes(this.selectedNode.id));
    }
    return this.summary;
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

  jumpToNode(nodeId: string): void {
    const target = this.flatNodes.find((node) => node.id === nodeId);
    if (target) {
      this.selectedNode = target;
      this.focusNodeId = target.id;
      this.selectedPath = this.buildPath(target.id);
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

  private buildSummary(nodes: HierarchyNode[]): HierarchySummary {
    const now = new Date();
    const summary: HierarchySummary = {
      total: 0,
      leaves: 0,
      active: 0,
      inProgress: 0,
      blocked: 0,
      review: 0,
      done: 0,
      waiting: 0,
      overdue: 0,
      completionPct: 0,
    };

    nodes.forEach((node) => {
      summary.total += 1;
      if (node.isLeaf || !node.children?.length) {
        summary.leaves += 1;
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
        case 'review':
          summary.review += 1;
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
        const deadlineDate = new Date(node.deadline);
        if (!Number.isNaN(deadlineDate.getTime()) && deadlineDate < now && node.status !== 'done') {
          summary.overdue += 1;
        }
      }
    });

    summary.completionPct =
      summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

    return summary;
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

  private getSubtreeNodes(nodeId: string): HierarchyNode[] {
    const root = this.findNode(nodeId, this.data);
    return root ? this.flattenNodes([root]) : this.flatNodes;
  }

  private findNode(targetId: string, nodes: HierarchyNode[]): HierarchyNode | null {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children?.length) {
        const found = this.findNode(targetId, node.children);
        if (found) {
          return found;
        }
      }
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
}
