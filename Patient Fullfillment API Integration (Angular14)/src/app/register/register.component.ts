import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiServiceService as ApiService } from '../services/api-service.service';
import { CanComponentDeactivate } from '../guards/candeactivate.guard';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  providers: [DatePipe]
})
export class RegisterComponent implements OnInit, CanComponentDeactivate {
  registerForm!: FormGroup;
  isSubmitted = false;

  constructor(
    private _fb: FormBuilder,
    private _apiService: ApiService,
    private _snackBar: MatSnackBar,
    private _datePipe: DatePipe,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }


  private initializeForm(): void {
    this.registerForm = this._fb.group({
      first_name: ['', [Validators.required, Validators.minLength(4)]],
      last_name: [''],
      mobile: ['', [Validators.required,  Validators.minLength(10), Validators.maxLength(10), Validators.pattern('^[0-9]*$')]],
      zipcode: ['', [Validators.required, Validators.maxLength(6),Validators.pattern(/^[1-9][0-9]{5}$/)]],
      dob: ['', Validators.required],
      gender: ['', Validators.required],
      blood_group: ['']
    });
  }

  // Main submit handler
  onSubmit(): void {
    this.isSubmitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    const formData = this.prepareFormData();
    this.submitFormData(formData);
  }

  private prepareFormData(): any {
    const formattedDate = this._datePipe.transform(this.registerForm.value.dob, 'yyyy-MM-dd');
    return {
      ...this.registerForm.value,
      dob: formattedDate
    };
  }

  private submitFormData(formData: any): void {
    this._apiService.addPatient(formData).subscribe(
      response => this.handleResponse(response),
      error => this.handleError(error)
    );
  }

  private handleResponse(response: any): void {
    if (response.status_code === 0) {
      this._snackBar.open(response.status_message, 'Close', { duration: 3000 });
    } else {
      this._snackBar.open(response.status_message, 'Close', { duration: 3000 });
      this.handleSuccess(response.data.patient_id);
    }
  }

  private handleSuccess(patientId: string): void {
    sessionStorage.setItem("patient_id", patientId);
    this._apiService.patient_id = patientId; 
    this._apiService.patientData = null;
    
    this.isSubmitted = false; 
    this.resetForm();
     of(null) // Creates observable that emits null...to mimic async and use delay
      .pipe(delay(3000)) 
      .subscribe(() => {
        this._router.navigate(['/home']); 
      });
  }

  private handleError(error: any): void {
    this._snackBar.open(error.error.status_message || 'Failed to add patient', 'Close', { duration: 10000 });
  }

  private resetForm(): void {  
    this.registerForm.reset();
    this.registerForm.markAsPristine(); 
    this.registerForm.markAsUntouched();  
  }

  // Implementing the canDeactivate method
  canDeactivate(): boolean {
    if (this.registerForm.dirty && !this.isSubmitted) {
      return confirm('You have unsaved changes! Do you really want to leave?');
    }
    return true;
  }
}









