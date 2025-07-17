import { TestBed } from '@angular/core/testing';

import { EventList } from './event-list';

describe('EventList', () => {
  let service: EventList;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventList);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
