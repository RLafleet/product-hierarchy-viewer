import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { HierarchyViewerService } from './services/hierarchy-viewer.service';
import { HierarchyViewerCore } from './core/hierarchy-viewer-core';
import { HierarchyNode, NodeUpdate, ViewerConfig } from './models/hierarchy.models';

// Angular wrapper for the core hierarchy viewer.
@Component({
  selector: 'product-hierarchy-viewer',
  templateUrl: './product-hierarchy-viewer.component.html',
  styleUrls: ['./product-hierarchy-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductHierarchyViewerComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() data: HierarchyNode[] = [];
  @Input() config: ViewerConfig = {};
  @Input() focusNodeId: string | null = null;

  @Output() nodeSelected = new EventEmitter<HierarchyNode>();
  @Output() nodeToggled = new EventEmitter<HierarchyNode>();
  @Output() nodeUpdated = new EventEmitter<NodeUpdate>();

  @ViewChild('container', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  private viewer: HierarchyViewerCore | null = null;

  constructor(private readonly viewerService: HierarchyViewerService) {}

  ngAfterViewInit(): void {
    this.viewer = this.viewerService.create(
      this.containerRef.nativeElement,
      this.data,
      this.config,
      {
        onNodeSelected: (node) => this.nodeSelected.emit(node),
        onNodeToggled: (node) => this.nodeToggled.emit(node),
        onNodeUpdated: (update) => this.nodeUpdated.emit(update),
      }
    );

    if (this.focusNodeId) {
      this.viewerService.focus(this.viewer, this.focusNodeId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewer) {
      return;
    }

    const dataChanged = changes['data'];
    const configChanged = changes['config'];
    const focusChanged = changes['focusNodeId'];

    if (dataChanged || configChanged) {
      this.viewer.update(
        dataChanged ? this.data : undefined,
        configChanged ? this.config : undefined
      );
    }

    if (focusChanged) {
      this.viewerService.focus(this.viewer, this.focusNodeId ?? null);
    }
  }

  ngOnDestroy(): void {
    this.viewer?.destroy();
    this.viewer = null;
  }
}
