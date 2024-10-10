import { Appdb } from '../model/appdb';
import SlotsModel,{SlotsAvailability} from './dbSlotsModel';


export interface BookedSlotSchema {
    id?: number;         
    doctor_id: number; 
    patient_id: number;    
    clinic_id: number;  
    slot_id:number;
    appointment_date?: Date;
    appointment_time?: any;
    fee: number;
    status?: string;
    updated_at?:any;      
}


class SlotBookingModel extends Appdb {

  constructor() {
    super();
    this.table = 'booked_appointment_slots';
    this.uniqueField = 'id';
}



/**
 * Books a slot for a patient with a specified doctor at a clinic.
 * 
 * @param slot_id - The ID of the slot to be booked.
 * @param doctor_id - The ID of the doctor for the appointment.
 * @param patient_id - The ID of the patient booking the appointment.
 * @param clinic_id - The ID of the clinic where the appointment is scheduled.
 * @param appointment_time - The time of the appointment (string or any type).
 * @param appointment_date - The date of the appointment (string or any type).
 * @param fee - The fee for the appointment.
 * 
 * @returns A promise that resolves to the booked slot schema.
 */
async bookSlot(slot_id:number,doctor_id:number,patient_id:number,clinic_id:number,appointment_time:string|any,appointment_date:string|any, fee:number):Promise<BookedSlotSchema>{
    const data ={
      doctor_id,patient_id,clinic_id,slot_id,appointment_date,appointment_time,fee,status:"booked"
    }    
    const response = await this.insertRecord(data);
    return response;
}


/**
 * Updates the status of a booking.
 * 
 * @param id - The ID of the booking to be updated.
 * @param newStatus - The new status to set for the booking (e.g., "cancelled").
 * 
 * @returns A promise that resolves to a boolean indicating success (true) or failure (false).
 * 
 * @throws Error if the booking is not found or if an update is attempted within 2 hours of the appointment.
 */
async cancelBookingStatus(id: number): Promise<any | boolean> {
    // Fetch the booking record using the provided ID
    const booking = await this.getBookingByBookingId(id);
    if (!booking) {
        return {status:false,message:"Slot not found"};
    }
 
    // Construct the appointment date and time as a Date object
    const todaysDate=new Date();  //obj type: 2024-10-07T07:06:47.891Z
    const appointmentDate=booking.appointment_date; //obj type: 2024-10-07T07:06:47.891Z   ...from db 
    const appointmentTime=booking.appointment_time; // from db type string: 09:06:47
    
    // Check if today's date is greater than or equal to the appointment date
    if (todaysDate > appointmentDate) {
        return {status:false,message:"Can't cancel booking. Cancellation Date expired. Cancellation is only allowed up to 2 hours before the appointment."};
    }

    // If the dates are the same, check for the time
    if (todaysDate.toDateString() === appointmentDate.toDateString()) {
        // Extract appointment time and convert it to a Date object for comparison
        const [hours, minutes, seconds] = appointmentTime.split(':').map(Number);
        const appointmentDateTime = new Date(appointmentDate);
        appointmentDateTime.setHours(hours, minutes, seconds); // Set the time of the appointment
     
        // Calculate the threshold time (2 hours before the appointment)
        const twoHoursBefore = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
      
        // Check if the current time is before the threshold time
        if (todaysDate < twoHoursBefore) {
            return {status:false,message:"Can't cancel booking. Cancellation is only allowed up to 2 hours before the appointment."};
        }
    }

    // Proceed to cancel the booking if checks are passed
    const result = await this.updateRecord(id, {status:'cancelled'});
    if (result) {
        // Update the slot status if the booking was successfully updated
        const finalResult = await SlotsModel.updateSlotStatus(booking.slot_id, 'cancelled');
        return {status:true,message:'Cancelled your refund underProcess.'} ;
    }

    return {status:false,message:'cannot cancel'}; // Return false if the update was not successful
}


  

 /** Access: Admin only...
//    * Fetch all bookings of patient by patient ID
//    * @returns All booking records.
//    */
  async findBookingsByPatientId(patientId:number): Promise<any> {
    this.where=` where patient_id=${patientId}`
    this.orderby=`order by updated_at DESC`
    const result = await this.allRecords('*');
    return result.length > 0 ? result : null; 
  }




/**
//    * Fetch all bookings of a patient using doctorID.
//    * @returns All booking records.
//    */
  async findBookingsByDoctorId(doctorId:number): Promise<any> {
    this.where=`where doctor_id=${doctorId}`
    this.orderby=`order by updated_at DESC`
    const result = await this.allRecords('*');
    return result.length > 0 ? result : null; 
  }




/** Access: Admin only...
//    * Fetch all bookings of each and every doctor/patient(admin only).
//    * @returns All booking records.
//    */
  async findAllBookings(): Promise<any> {
    this.orderby=`order by updated_at DESC`
    const result = await this.allRecords('*');
    return result.length > 0 ? result : null; 
  }


 /** 
//    * Fetch booking by bookinngId.
//    * @returns booking detials.
//    */
  async getBookingByBookingId(id:number): Promise<any> {
    this.orderby=`order by updated_at DESC`;
    const result = await this.allRecords('*');
    return result.length > 0 ? result[0] : null; 
  }
 


} 

export default new SlotBookingModel();