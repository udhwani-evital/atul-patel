import { Appdb } from '../model/appdb';

export interface Doctor {
  id?: number;
  doctor_id?: number;
  name?: string;
  mobile?: string;
  password?: string;
  registration_number?: string;
  address?: string;
  gender?: string;
  qualifications?: string;
  year_of_experience?: number;
  speciality_id?: number;
  specialty?: string;
  clinic_id?: number;
  total_consultation?: number;
  diseases_covered?:string;
}

class DoctorModel extends Appdb {
  constructor() {
    super();
    this.table = 'doctor';
    this.uniqueField = '';
  }

  /**
   * Finds all doctors in the database.
   * @returns An array of all doctors.
   */
  async findAllClinics(): Promise<Doctor[]> {
    this.table='clinic';
    this.uniqueField='';
    const result= this.allRecords('*');
    return result;
  }

  /**
   * Finds all specialties in the database.
   * @returns An array of all specialties.
   */
  async findAllSpecialties(): Promise<any> {
    this.table = 'specialty';
    const result= this.allRecords('*');
    return result;
  }

  /**
   * Finds a doctor by their ID.
   * @param doctor_id The ID of the doctor to find.
   * @returns The found doctor or null if not found.
   */
  async findDoctorById(doctor_id: number): Promise<Doctor | null> {
    this.where =`where doctor_id=${doctor_id}`;
    const fields =`d.doctor_id,d.name,d.mobile,d.email,d.registration_number,d.address,d.gender,d.qualifications,d.year_of_experience,d.specialty_id,d.total_consultations,s.specialty , s.diseases_covered As covered_diseases`;
    this.table=`doctor d
      LEFT JOIN specialty s ON d.specialty_id=s.specialty_id`;
    const result = await this.allRecords(fields);
    return result.length > 0 ? result[0] : null;
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
  

  /**
   * Deletes a clinic by ID.
   * Admin access required.
   * @param id The ID of the clinic to delete.
   * @returns The result of the delete operation.
   */
  async deleteClinic(id: number): Promise<any> {
    this.table = 'clinic';
    this.uniqueField = 'clinic_id';
    const result = await this.deleteRecord(id);
    return result;
  }


  /**
   * Deletes a doctor by their ID.
   * Admin access required.
   * @param id The ID of the doctor to delete.
   * @returns The result of the delete operation.
   */
  async deleteDoctorById(id: number): Promise<any> {
    this.uniqueField='doctor_id';
    const result = await this.deleteRecord(id);
    return result;
  }



   /** can be used on page load when querysearch is not there:
   * Fetches all doctors along with their specialty details.
   * @returns An array of doctors with specialty details.
   */
  async findAllDoctorsWithSpecialties(): Promise<Doctor[]> {
    const fields =`d.doctor_id,d.name,d.mobile,d.email,d.registration_number,d.address,d.gender,d.qualifications,d.year_of_experience,d.specialty_id,d.total_consultations, s.specialty , s.diseases_covered As covered_diseases`;
    this.table=`doctor d
      LEFT JOIN specialty s ON d.specialty_id=s.specialty_id`;
    this.orderby=`order by d.specialty_id`;
    const result = await this.allRecords(fields);
    return result;
  }
  


  /**
 * Searches for doctors along with their specialty details based on disease name,
 * doctor name, or specialty name.
 * @param searchTerm The term to search for in doctor names, specialties, or diseases.
 * @returns An array of doctors with specialty details that match the search criteria.
 */
async searchDoctorsWith_Specialization_Disease_DoctorName(searchTerm: string): Promise<Doctor[]> {
    const sanitizedTerm = searchTerm.trim().replace(/'/g, "''"); // for clear space and sql injection prevention

    const fields = `d.doctor_id, d.name as Doctor_Name,d.mobile as contact_nummber, s.specialty, s.diseases_covered AS covered_diseases`;
    this.table = `doctor d
        LEFT JOIN specialty s ON d.specialty_id = s.specialty_id`;
    
    this.where = `
        WHERE d.name ILIKE '%${sanitizedTerm}%' 
        OR s.specialty ILIKE '%${sanitizedTerm}%' 
        OR s.diseases_covered ILIKE '%${sanitizedTerm}%'`;

    this.orderby = `ORDER BY d.name`; 
    const result = await this.allRecords(fields);

    return result;
}




/**
 * Searches for doctors along with their schedules and clinic details based on a generic query parameter.
 * @param query The search term used to find matching doctors, specialties, or diseases.
 * @returns An array of doctors with their schedules and clinic information that match the search criteria.
 */
async searchDoctorsWithSchedules(query: string): Promise<any[]> {
    const fields = `
        d.doctor_id,d.name,d.mobile,d.email,d.registration_number,d.address,d.gender,d.qualifications,d.year_of_experience,d.specialty_id,d.total_consultations, s.specialty, s.diseases_covered AS covered_diseases, 
        ds.start_time, ds.end_time, ds.consultation_duration, ds.day, ds.fee, 
        c.name AS clinic_name, c.address AS clinic_address
    `;
    
    this.table = `doctor d
        LEFT JOIN specialty s ON d.specialty_id = s.specialty_id
        LEFT JOIN doctor_schedule ds ON d.doctor_id = ds.doctor_id
        LEFT JOIN clinic c ON ds.clinic_id = c.clinic_id`;
    
    this.where = `
        WHERE d.name ILIKE '%${query}%' 
        OR s.specialty ILIKE '%${query}%' 
        OR s.diseases_covered ILIKE '%${query}%'`;
    
    // Order results first by doctor_id and then by day of the week
    this.orderby = `ORDER BY d.doctor_id, ds.day`; 
    
    const result = await this.allRecords(fields);
    return result;
} 
  

}

export default new DoctorModel();

