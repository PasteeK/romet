import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleScreen } from './title-screen';

describe('TitleScreen', () => {
  let component: TitleScreen;
  let fixture: ComponentFixture<TitleScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TitleScreen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TitleScreen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
