import  { Appdb } from '../model/appdb';

export interface DoctorSchedule {
  id?: number;
  doctor_id: number;
  clinic_id: number;
  start_time: string; // e.g., '09:00:00'
  end_time: string;   // e.g., '17:00:00'
  consultation_duration: number; // in minutes
  day: string ;// e.g., one at a time ...'Monday,Tuesday'
  fee:number
}

class DoctorScheduleModel extends Appdb {
  constructor() {
    super();
    this.table = 'doctor_schedule';
    this.uniqueField = 'id';
}



  /** Admin, doctor access:
   * check for conflict in scdule time/day.
   * @param schedule The schedule data is verified for any conflict of timing or day.
   * @returns The added schedule with its ID, or null if the insertion failed.
   */
   async checkScheduleConflict(doctorId: number, startTime: any, endTime: any, day: string ) {
        // checking conflict: 
        this.where = `WHERE (
        (doctor_id = ${doctorId} AND day='${day}')
            AND (
                ('${startTime}' BETWEEN start_time AND end_time) OR
                ('${endTime}' BETWEEN start_time AND end_time) OR
                (start_time BETWEEN '${startTime}' AND '${endTime}') OR
                (end_time BETWEEN '${startTime}' AND '${endTime}')
     ))`;
           
        
        const result = await this.allRecords('*');
        return result.length > 0; // Returns true if conflicts are found
    }

  /** Admin, doctor power:
   * Adds a new schedule for a doctor.
   * @param schedule The schedule data to be added.
   * @returns The added schedule with its ID, or null if the insertion failed.
   */
  async addSchedule(schedule: DoctorSchedule): Promise<DoctorSchedule | null> {
    const result = await this.insertRecord(schedule);
    return result > 0 ? { id: result,...schedule } : null;
  }

  /** Admin doctor access:
   * Updates an existing doctor's schedule.
   * @param id The ID of the schedule to update.
   * @param updates The updates to apply to the schedule.
   * @returns True if the update was successful, false otherwise.
   */
  async getScheduleById(id: number): Promise<DoctorSchedule| null> {
    this.where = `where id=${id}`;
    const result = await this.allRecords('*');
    return result.length > 0 ? result[0] : null;
  }


  /** Admin doctor access:
   * Deletes a doctor's schedule by its ID.
   * @param id The ID of the schedule to delete.
   * @returns True if the deletion was successful, false otherwise.
   */
  async deleteSchedule(id: number): Promise<boolean> {
    const result = await this.deleteRecord(id);
    return result > 0?result:null;
  }

  /** Admin, doctor,patient access:
   * Retrieves all schedules for a specific doctor.
   * @param doctorId The ID of the doctor whose schedules to retrieve.
   * @returns An array of schedules for the doctor, or an empty array if none found.
   */
  async getScheduleByDoctorId(doctor_id: number): Promise<DoctorSchedule[]> {
    this.where=`where doctor_id=${doctor_id}`
    const result = await this.allRecords('*');
    return result.length > 0 ? result : [];
  }


  /** Admin access:
   * Retrieves all schedules for all doctor.
   * @returns An array of schedules for the doctors, or an empty array if none found.
   */
  async allSchedulesRecords(): Promise<DoctorSchedule[]> {
    this.orderby=`order by doctor_id`
    const result = await this.allRecords("*");
    return result.length > 0 ? result : [];
  }


}

export default new DoctorScheduleModel();
