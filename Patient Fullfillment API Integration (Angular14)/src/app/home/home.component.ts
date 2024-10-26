import { Component, OnInit } from '@angular/core';
import { ApiServiceService } from '../services/api-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { PatientDetailsViewFormComponent } from '../patient-details-view-form/patient-details-view-form.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  patient_id: string = "";
  mobile: string = "";
  patientData: any = null; 

  constructor(private _apiService: ApiServiceService, private _snackBar: MatSnackBar,private bottomSheet: MatBottomSheet) {}


  ngOnInit(): void {
    this.patientData = this._apiService.patientData || null; 
    // this.patient_id = this._apiService.patient_id ||"";
    if (!this.patientData) {
      this.fetchPatientData();
    }
  }



  // fetch patient from api :
  fetchPatientData(){
     this.patient_id = this._apiService.patient_id ||"";

     // Check if we have either patient_id or mobile
     if (this.patient_id || this.mobile) {
      const formData = this.patient_id ? { patient_id: this.patient_id } : { mobile: this.mobile };

      // Fetching patient data
      this._apiService.viewPatient(formData).subscribe(
        response => {
          if (response.status_code === 0) {
            this.patientData = null; 
            this._snackBar.open(response.status_message, 'Close', { duration: 3000 });             
          }
          else {
            // Successfully fetched patient data
            this.patientData = response.data[0];
            this._apiService.patientData =  response.data[0];
            sessionStorage.setItem("patient_id", response.data[0].patient_id || this._apiService.patient_id);
            this._snackBar.open("Patient data retrieved successfully", 'Close', { duration: 3000 });
          }
        },
        error => {
          this.patientData = null;
          this._snackBar.open(error.error.status_message || 'Failed to view patient', 'Close', { duration: 3000 });           
        }
      );
    } 
    else {
      this._snackBar.open("No patient found. Please register.", 'Close', { duration: 3000 });
    }

  }



  openBottomSheet(): void {
    const bottomSheetRef = this.bottomSheet.open(PatientDetailsViewFormComponent);

    bottomSheetRef.afterDismissed().subscribe(result => {
      if (result) {
        this.patient_id = result.patient_id || ""; 
        this.mobile = result.mobile || "";
        this.fetchPatientData(); // Fetch patient data with the new information form bottom sheet
      }
    });
  }

}

