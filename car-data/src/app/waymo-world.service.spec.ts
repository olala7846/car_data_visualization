import { TestBed } from '@angular/core/testing';

import { WaymoWorldService } from './waymo-world.service';

describe('WaymoWorldService', () => {
  let service: WaymoWorldService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaymoWorldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
