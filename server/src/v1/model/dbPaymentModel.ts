import { Appdb } from '../model/appdb';

export interface Payment {
    id?: number; 
    appointment_id: number; 
    amount: number; 
    payment_status: 'completed' | 'failed'; 
    updated_at?: Date; 
}

class PaymentModel extends Appdb {
    constructor() {
        super();
        this.table = 'Payment'; // Name of the table in the database
        this.uniqueField = 'id'; // Unique field used for record identification
    }



    
    /**
     * Creates a new payment in the database.
     * @param payment - The payment data to create.
     * @returns The ID of the newly created payment, or null if creation failed.
     */
    async createPayment(payment: Payment): Promise<any | null> {
        const result = await this.insertRecord(payment);
        return result > 0 ? result : null; // Returns the ID of the newly created payment
    }



    /**
     * Finds a payment by its ID.
     * @param id - The ID of the payment to find.
     * @returns The payment object if found, or null if not found.
     */
    async findPaymentById(id: number): Promise<Payment | null> {
        this.where=`WHERE id = ${id}`;
        const result = await this.allRecords('*');
        return result.length > 0 ? result[0] : null; 
    }





    /**
     * Updates the payment status of a specific payment.
     * @param id - The ID of the payment to update.
     * @param status - The new payment status to set.
     * @returns True if the update was successful, otherwise false.
     */
    async updatePaymentStatus(id: number, status: 'pending' | 'completed' | 'failed'): Promise<any> {
        const result = await this.updateRecord(id, { payment_status: status });
        return result > 0; // Returns true if update was successful
    }




    /**
     * Retrieves all payments from the database.
     * @returns An array of all payment records.
     */
    async getAllPayments(): Promise<Payment[]> {
        return this.allRecords(); // Returns all payment records
    }




    /**
     * Retrieves payments associated with a specific doctor.
     * @param doctorId - The ID of the doctor to fetch payments for.
     * @returns An array of payment records related to the specified doctor.
     */
    async getPaymentsByDoctorId(doctorId: number): Promise<Payment[]> {
        this.where = `WHERE appointment_id IN (SELECT id FROM booked_appointment_slots WHERE doctor_id = ${doctorId}`
        const result = await this.allRecords('*');
        return result; // Returns payments linked to the specified doctor
    }



    /**
     * Retrieves payments associated with a specific patient.
     * @param patientId - The ID of the patient to fetch payments for.
     * @returns An array of payment records related to the specified patient.
     */
    async getPaymentsByPatientId(patientId: number): Promise<Payment[]> {
        this.where=`WHERE appointment_id IN (SELECT id FROM booked_appointment_slots WHERE patient_id = ${patientId})`;
        const result = await this.allRecords('*');
        return result; // Returns payments linked to the specified patient
    }




    /**
     * Retrieves a payment by its associated appointment ID.
     * @param appointmentId - The ID of the appointment to fetch the payment for.
     * @returns The payment object if found, or null if not found.
     */
    async getPaymentByAppointmentId(appointmentId: number): Promise<Payment | null> {
        this.where=`where appointment_id=${appointmentId}`;
        const result = await this.allRecords('*');
        return result; // Returns the payment linked to the specified appointment
    }
}

export default new PaymentModel();
