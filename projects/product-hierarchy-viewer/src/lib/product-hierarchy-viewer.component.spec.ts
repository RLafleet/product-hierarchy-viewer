import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductHierarchyViewerComponent } from './product-hierarchy-viewer.component';
import { HierarchyViewerService } from './services/hierarchy-viewer.service';

describe('ProductHierarchyViewerComponent', () => {
  let component: ProductHierarchyViewerComponent;
  let fixture: ComponentFixture<ProductHierarchyViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductHierarchyViewerComponent],
      providers: [HierarchyViewerService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductHierarchyViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
