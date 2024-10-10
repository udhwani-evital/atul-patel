import { Appdb } from '../model/appdb';

export interface Patient {
  patient_id?: number;
  name?: string;
  mobile?: string;
  email?: string;
  password?:string;
  address?: string;
  gender?:string;
  medical_history?:string;
  age?:number;
}

class PatientModel extends Appdb {
  constructor() {
    super();
    this.table = 'patient';
    this.uniqueField = 'patient_id';
  }
 

}

export default new PatientModel();
