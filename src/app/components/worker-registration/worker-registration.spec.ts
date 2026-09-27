import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerRegistration } from './worker-registration';

describe('WorkerRegistration', () => {
  let component: WorkerRegistration;
  let fixture: ComponentFixture<WorkerRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerRegistration],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
