import { TestBed } from '@angular/core/testing';

import { SavegameService } from './savegame.service.js';

describe('SavegameServiceTs', () => {
  let service: SavegameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SavegameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
