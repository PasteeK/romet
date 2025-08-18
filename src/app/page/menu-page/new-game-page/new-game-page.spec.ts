import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGamePage } from './new-game-page';

describe('NewGamePage', () => {
  let component: NewGamePage;
  let fixture: ComponentFixture<NewGamePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewGamePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewGamePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
