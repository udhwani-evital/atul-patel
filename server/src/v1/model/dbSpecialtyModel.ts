import { Appdb } from '../model/appdb';

export interface Specialty {
   specialty_id?: number;
   speciality:string;
   diseases_covered: string;  
}

class SpecialtyModel extends Appdb {
  constructor() {
    super();
    this.table = 'specialty';
    this.uniqueField = 'specialty_id';
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

export default new SpecialtyModel();

