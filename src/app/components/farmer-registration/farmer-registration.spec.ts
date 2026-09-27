import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FarmerRegistration } from './farmer-registration';

describe('FarmerRegistration', () => {
  let component: FarmerRegistration;
  let fixture: ComponentFixture<FarmerRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerRegistration],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
