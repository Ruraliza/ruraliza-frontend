import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerList } from './worker-list';

describe('WorkerList', () => {
  let component: WorkerList;
  let fixture: ComponentFixture<WorkerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerList],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
