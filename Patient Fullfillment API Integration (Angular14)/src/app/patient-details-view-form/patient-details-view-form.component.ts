import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-patient-details-view-form',
  templateUrl: './patient-details-view-form.component.html',
  styleUrls: ['./patient-details-view-form.component.css']
})


export class PatientDetailsViewFormComponent {

  patientDetailForm!: FormGroup;
  selectedOption: string = '';

  constructor( 
    private _bottomSheetRef: MatBottomSheetRef<PatientDetailsViewFormComponent>,
    private _formBuilder: FormBuilder) {
      // Initialize the form
    this.patientDetailForm = this._formBuilder.group({
      patient_id: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('^[0-9]*$')]],
    });
     }



  // Method to handle the radio button selection
  onOptionChange(option: string) {
    this.selectedOption = option;
    if (option === 'mobile') {
      this.patientDetailForm.get('mobile')?.enable(); 
      this.patientDetailForm.get('patient_id')?.disable(); 
    } else {
      this.patientDetailForm.get('patient_id')?.enable(); 
      this.patientDetailForm.get('mobile')?.disable(); 
    }
  }

  // Submit the form
  submit() {
    const result = {
      patient_id: this.patientDetailForm.value.patient_id || '',
      mobile: this.patientDetailForm.value.mobile || '',
    };

    this._bottomSheetRef.dismiss(result); 
  }

}