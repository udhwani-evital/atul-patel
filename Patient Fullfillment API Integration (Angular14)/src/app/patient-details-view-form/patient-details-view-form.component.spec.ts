import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientDetailsViewFormComponent } from './patient-details-view-form.component';

describe('PatientDetailsViewFormComponent', () => {
  let component: PatientDetailsViewFormComponent;
  let fixture: ComponentFixture<PatientDetailsViewFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientDetailsViewFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientDetailsViewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
