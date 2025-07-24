import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleMenu } from './title-menu';

describe('TitleMenu', () => {
  let component: TitleMenu;
  let fixture: ComponentFixture<TitleMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TitleMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TitleMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
