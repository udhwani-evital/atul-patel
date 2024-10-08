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

  /** ADMIN power:
   * Finds all patients in the database.
   * @returns An array of all patients.
   */
  async findAllPatients(): Promise<Patient[]> {
    return this.allRecords();
  }

  /** ANY logged in user accesss:
   * Finds a patient by their ID.
   * @param id The ID of the patient to find.
   * @returns The found patient or null.
   */
  async findPatientById(patient_id: number): Promise<Patient | null> {
    const result = await this.selectRecord(patient_id);
    //console.log("fetched patient by id: ",result)
    return result.length > 0 ? result[0] : null;
  }

  /** Admin access only:
   * Deletes a patient by their ID (admin only).
   * @param id The ID of the patient to delete.
   * @returns The result of the delete operation.
   */
  async deletePatientById(patient_id: number): Promise<any> {
    const result = await this.deleteRecord(patient_id);
    return result;
  }
}

export default new PatientModel();
