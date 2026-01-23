import { Component } from '@angular/core';
import { HierarchyNode, NodeUpdate, ViewerConfig } from 'product-hierarchy-viewer';
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

interface DashboardMetric {
  key: keyof HierarchySummary;
  label: string;
  color: string;
}

@Component({
  selector: 'app-hierarchy-page',
  templateUrl: './hierarchy-page.component.html',
  styleUrls: ['./hierarchy-page.component.scss'],
})
export class HierarchyPageComponent {
  data: HierarchyNode[] = MOCK_HIERARCHY;
  selectedNode: HierarchyNode | null = null;
  focusNodeId: string | null = null;

  private readonly flatNodes = this.flattenNodes(this.data);
  private readonly nodeIndex = new Map(this.flatNodes.map((node) => [node.id, node]));

  summary: HierarchySummary = this.buildSummary(this.flatNodes);

  dashboardConfig: DashboardMetric[] = [
    { key: 'inProgress', label: 'В работе', color: '#f59e0b' },
    { key: 'active', label: 'Активно', color: '#0ea5e9' },
    { key: 'blocked', label: 'Блок', color: '#ef4444' },
    { key: 'review', label: 'Проверка', color: '#7c3aed' },
    { key: 'waiting', label: 'Ожидание', color: '#6b7280' },
    { key: 'done', label: 'Готово', color: '#16a34a' },
  ];

  private readonly statusLabels: Record<string, string> = {
    active: 'Активно',
    'in-progress': 'В работе',
    blocked: 'Блокировано',
    review: 'На проверке',
    done: 'Готово',
    waiting: 'Ожидание',
  };

  private readonly typeLabels: Record<string, string> = {
    area: 'Участок',
    product: 'Изделие',
    assembly: 'Узел',
    part: 'Деталь',
    platform: 'Платформа',
  };

  config: ViewerConfig = {
    initialDepth: 2,
    maxDepth: 5,
    enableAnimations: true,
    enablePanZoom: true,
    nodeStyles: {
      active: { color: '#b7efe7', borderColor: '#0f766e' },
      'in-progress': { color: '#ffe1b8', borderColor: '#c26b1e' },
      blocked: { color: '#ffc4ad', borderColor: '#c2412e' },
      done: { color: '#baf2c7', borderColor: '#1b7f4d' },
      waiting: { color: '#e7edf2', borderColor: '#5b6a75' },
      review: { color: '#f3ddc5', borderColor: '#8a5d3b' },
      area: { color: '#c7f0df', borderColor: '#1b7f6b' },
      product: { color: '#bfe9ff', borderColor: '#227b98' },
      assembly: { color: '#ffe0c2', borderColor: '#b65b1c' },
      part: { color: '#f6f1e9', borderColor: '#8d8a80' },
      platform: { color: '#e4f2c2', borderColor: '#6b8f2a' },
    },
  };

  get selectedPath(): string {
    if (!this.selectedNode) {
      return '';
    }

    const names: string[] = [];
    let current: HierarchyNode | undefined | null = this.selectedNode;
    while (current) {
      names.unshift(current.name);
      current = current.parentId ? this.nodeIndex.get(current.parentId) : null;
    }

    return names.join(' / ');
  }

  onNodeSelected(node: HierarchyNode): void {
    this.selectedNode = node;
    this.focusNodeId = node.id;
  }

  onNodeToggled(node: HierarchyNode): void {
    this.selectedNode = node;
    this.focusNodeId = node.id;
  }

  onNodeUpdated(update: NodeUpdate): void {
    // Placeholder: replace with form-driven editing later.
    console.log('nodeUpdated', update);
  }

  getStatusLabel(status?: string): string {
    if (!status) {
      return 'Без статуса';
    }
    return this.statusLabels[status] ?? status;
  }

  getTypeLabel(type?: string): string {
    if (!type) {
      return '—';
    }
    return this.typeLabels[type] ?? type;
  }

  statusClass(status?: string): string {
    return status ? `status-${status}` : 'status-unknown';
  }

  formatDeadline(value?: string): string {
    if (!value) {
      return '—';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('ru-RU');
  }

  get detailMap(): HierarchyNode[] {
    return this.flatNodes.filter((node) => node.isLeaf || !(node.children?.length));
  }

  get scopedSummary(): HierarchySummary {
    const scope = this.selectedNode ? this.getSubtreeNodes(this.selectedNode.id) : this.flatNodes;
    return this.buildSummary(scope);
  }

  jumpToNode(nodeId: string): void {
    const target = this.nodeIndex.get(nodeId) ?? null;
    this.selectedNode = target;
    this.focusNodeId = nodeId;
  }

  private buildSummary(nodes: HierarchyNode[]): HierarchySummary {
    const total = nodes.length;
    const leaves = nodes.filter((node) => node.isLeaf || !(node.children?.length)).length;
    const countStatus = (status: string): number =>
      nodes.filter((node) => node.status === status).length;
    const today = new Date().getTime();
    const overdue = nodes.filter((node) => {
      if (!node.deadline) return false;
      const ts = new Date(node.deadline).getTime();
      return !Number.isNaN(ts) && ts < today && node.status !== 'done';
    }).length;
    const completionPct =
      total === 0 ? 0 : Math.round((countStatus('done') / total) * 100);

    return {
      total,
      leaves,
      active: countStatus('active'),
      inProgress: countStatus('in-progress'),
      blocked: countStatus('blocked'),
      review: countStatus('review'),
      done: countStatus('done'),
      waiting: countStatus('waiting'),
      overdue,
      completionPct,
    };
  }

  private flattenNodes(nodes: HierarchyNode[]): HierarchyNode[] {
    const result: HierarchyNode[] = [];

    const visit = (node: HierarchyNode): void => {
      result.push(node);
      (node.children ?? []).forEach((child) => visit(child));
    };

    nodes.forEach((node) => visit(node));

    return result;
  }

  private getSubtreeNodes(nodeId: string): HierarchyNode[] {
    const root = this.nodeIndex.get(nodeId);
    if (!root) {
      return this.flatNodes;
    }
    const collected: HierarchyNode[] = [];
    const walk = (node: HierarchyNode): void => {
      collected.push(node);
      (node.children ?? []).forEach((child) => walk(child));
    };
    walk(root);
    return collected;
  }
}
