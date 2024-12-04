import { Appdb } from '../model/appdb';
import { Functions } from '../library/functions';
import cron from 'node-cron';

export interface SlotsAvailability {
    id?: number;       
    schedule_id: number;   
    doctor_id: number;     
    clinic_id: number;     
    slot_time: string;     
    slot_duration: number;  
    slot_date: string;     
    status: string; 
    fee: number;       
}


class SlotsModel extends Appdb {
  constructor() {
    super();
    this.table = 'slots_availability';
    this.uniqueField = 'id';
  }


/**
     * Generate slots for a given schedule ID.
     * @param slot The slot object of type SlotsAvailability iholds generated slot for a schedule
     * @returns A promise that resolves when slots have been generated.
*/
async storeSlotsForSchedule(slots: SlotsAvailability[]): Promise<SlotsAvailability[] | null> {
        const insertResults = [];
    for (const slot of slots) {
        const result = await this.insertRecord(slot); // Assuming insertRecord handles individual insertion
        insertResults.push(result);
    }
    return insertResults.length>0?insertResults:null;
} 
    

/** using at multiple places:
   * Update the status of a slot by its ID.
   * @param id The ID of the slot to update.
   * @param newStatus The new status to set ('booked' or 'cancelled').
   * @returns A promise that resolves to the updated slot, or null if not found.
*/
  async updateSlotStatus(id: number, newStatus: string|any): Promise<SlotsAvailability | null> {
        const result = await this.updateRecord(id,{status:newStatus});
        return result ? result:null;
  }




// get aall doctors list with available slots.......
async getDoctorsWithAvailableSlots(searchQuery:string){
    this.table=`doctor doc
            LEFT JOIN specialty spec ON doc.specialty_id = spec.specialty_id
            LEFT JOIN slots_availability slots ON doc.doctor_id = slots.doctor_id`;
    
    const fields="doc.doctor_id, doc.name AS doctor_name,doc.mobile AS doctor_mobile,spec.specialty AS specialty_name,spec.diseases_covered,slots.slot_time,slots.slot_date,slots.status";
    
    this.where=`slots.status = 'available' OR slots.status = 'cancelled'
            ${typeof searchQuery === 'string' && searchQuery !== '*' ? `AND (doc.name ILIKE '%${searchQuery}%' OR spec.specialty ILIKE '%${searchQuery}%' OR spec.diseases_covered ILIKE '%${searchQuery}%')` : ''}`;
    
    this.orderby=`order by doc.name AS doctor_name`

    const response = await this.allRecords(fields);

    return response.length>0?response:[];
 }





/**
 * Updates past date slots to +7 days and sets their status to 'available'.
 * @returns A promise that resolves to the number of updated rows.
 */
async updatePastDateSlotsDateAndStatus() {
    const functions = new Functions();
    const currentDate = new Date();
    const pastDate = new Date(currentDate.setDate(currentDate.getDate() - 1)); // Get yesterday's date object

    const newDate = new Date(pastDate);
    newDate.setDate(pastDate.getDate() + 7); // Replace past date with +7 days

    const formattedNewDate = functions.formatDateForPostgres(newDate); // Format new date for Postgres

    //data to update:
    const dataToUpdate = {
        slot_date: formattedNewDate, // Corrected syntax
        status: 'available'
    };
    
    this.where = `WHERE slot_date = '${functions.formatDateForPostgres(pastDate)}'`;
   
    const result = await this.update(this.table, dataToUpdate, this.where);
    return result.rowCount; 
}




   /**
     * Schedules a task to run daily at a specified time to update(date=>+7day i.e nex weekday date,status=>available) past days slots  .
     */
    public scheduleTask() {
        // * * * * * => min hour day_of_month month day_of_week
        cron.schedule('1 0 * * *', async () => { // Cron expression for 12:01 AM
        try {
            await this.updatePastDateSlotsDateAndStatus();
        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    });
        
    }

 }




export default new SlotsModel();





