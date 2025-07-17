import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapLayout } from './map-layout';

describe('MapLayout', () => {
  let component: MapLayout;
  let fixture: ComponentFixture<MapLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
