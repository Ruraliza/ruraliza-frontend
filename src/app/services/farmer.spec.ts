import { TestBed } from '@angular/core/testing';
import { Farmer } from './farmer';

describe('Farmer', () => {
  let service: Farmer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Farmer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
