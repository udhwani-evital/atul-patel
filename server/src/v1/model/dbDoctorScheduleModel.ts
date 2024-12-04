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


}

export default new DoctorScheduleModel();
