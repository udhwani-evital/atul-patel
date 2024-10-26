import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ApiResponse<T> {
  status_code: number;
  status_message: string;
  data: T;  
}


@Injectable({
  providedIn: 'root'
})

export class ApiServiceService {
  private api_add_patient_url= 'patients/add';
  private api_view_patient_url= 'patients/view';

  patient_id: string = sessionStorage.getItem("patient_id") || "";
  patientData: any = null;

  constructor(private http:HttpClient) { }



  // add patient to database...
  addPatient(formData: any): Observable<any> {
  const payload = { ...formData };
  return this.http.post(`${environment.apiEndpoint}${this.api_add_patient_url}`, payload)
}



  //view added details
  viewPatient(formData:any): Observable<any> {
  let payload: any = {};

  if (formData.mobile) {
    payload.mobile = formData.mobile;
  }
  else{
    payload.patient_id = formData.patient_id;
  } 

  return this.http.post(`${environment.apiEndpoint}${this.api_view_patient_url}`, payload);
}

}
