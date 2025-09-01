import { TestBed } from '@angular/core/testing';

import { StartGameService } from './start-game.service';

describe('StartGameService', () => {
  let service: StartGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StartGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
