import { Appdb } from '../model/appdb';

export interface Clinic {
   clinic_id?: number;
   name: string;
   address: string;
   contact_number: number;  
}

class ClinicModel extends Appdb {
  constructor() {
    super();
    this.table = 'clinic';
    this.uniqueField = 'clinic_id';
  }

 
  /**
   * Adds a new clinic record.
   * Admin/doctor access required.
   * @param clinicData The data for the clinic to create.
   * @returns The result of the insert operation.
   */
  async addClinic(clinicData: any): Promise<any> {
    const result = await this.insert('clinic', {
      name: clinicData.name,
      address: clinicData.address,
      contact_number: clinicData.contact_number,
    });
    return result;
  }

}

export default new ClinicModel();

