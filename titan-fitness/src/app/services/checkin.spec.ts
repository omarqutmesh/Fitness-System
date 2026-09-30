import { TestBed } from '@angular/core/testing';

import { Checkin } from './checkin';

describe('Checkin', () => {
  let service: Checkin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Checkin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
