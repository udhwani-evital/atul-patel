import { Request, Response, Router,NextFunction } from 'express';
import { Functions } from '../library/functions';
import SlotBookingModel from '../model/dbSlotBookingModel';
import SlotsModel from '../model/dbSlotsModel';


/**
 * Middleware to authorize roles.
 * @param allowedRoles - Array of roles that are allowed access.
 */
export let authorizedRoles = (...allowedRoles: string[]) => {
    const functions = new Functions();
    return (req: Request | any, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.body.user.role)) {
            return res.send(functions.output(0,"Access denied",null));
        }
        next();
    };
};

// ---------------------------ROUTES---------------------------------------
const router = Router();

//get all bookings : admin acees only:
router.get('/get_all_bookings', authorizedRoles('admin'), getAllBookedSlots); //tested

//get getBookedSlotByBookingId:
router.get('/get_booking_by_booking_id/:id', getBookingByBookingId);  //tested

//get getBookedSlotByBookingId:
router.get('/get_all_bookings_by_doctor_id/:id',authorizedRoles("doctor","admin"), findBookingsByDoctorId);  //tested


//get getBookedSlotByBookingId:
router.get('/get_all_bookings_by_patient_id/:id',authorizedRoles("patient","admin"), findBookingsByPatientId); //tested


//book a new slot
// @param: slot_id 
router.post('/book_new_slot/:id',authorizedRoles("patient"), makeBookingBySlotId);  //tested


//cancel the slot by appointment id:
router.patch('/cancel_booked_slot/:id', cancelBookingByAppointmentId);  //tested


export default router;

// --------------------------- FUNCTIONS------------------------------------------


// to book a slot based on slotId:
async function makeBookingBySlotId(req: Request, res: Response) {
    const functions = new Functions();
    try {
        const { id: slotID } = req.params;
        const { id: patient_id } = req.body.user;
        SlotsModel.where=`where id=${parseInt(slotID)}`
        const slotDetail = await SlotsModel.allRecords('*');

        if (!slotDetail || slotDetail.status === "booked") {
            return res.send(functions.output(0, "Slot not available for booking.", null));
        }

        const { doctor_id, clinic_id, slot_time, slot_date, fee } = slotDetail;
        
        // Use the helper function to convert slot_date to local string
        const datetoLocalFormat = functions.formatDateToLocalString(new Date(slot_date));
        
        // Update the booked slot availability status to booked
        const updateSlotAvailabilityStatus = await SlotsModel.updateSlotStatus(+slotID, "booked");
        if (!updateSlotAvailabilityStatus) {
            return res.send(functions.output(0, "Slot booking failed.", null));
        }

        // Slot locked, proceed for payment
        const paymentStatus = await function paymentForAppointment() {
            return true; // Simulating payment success
        };

        // On payment fail, rollback slot lock
        if (!paymentStatus) {
            await SlotsModel.updateSlotStatus(+slotID, "available");
            return res.send(functions.output(0, "Payment failed.", null));
        } else {
            // Payment is successful: save the booking data
            const result = await SlotBookingModel.bookSlot(+slotID, doctor_id, patient_id, clinic_id, slot_time, datetoLocalFormat, fee);
            if (!result) {
                await SlotsModel.updateSlotStatus(+slotID, "available");
                return res.send(functions.output(0, "Slot not booked. Payment reversal processed. Try again later.", null));
            } else {
                return res.send(functions.output(1, 'Slot booked successfully!', result));
            }
        }
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}




// Function to get all Booked slots: admin access:
async function getAllBookedSlots(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    try {
        SlotBookingModel.orderby=`order by updated_at DESC`
        const result = await SlotBookingModel.allRecords('*');
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No slot booking found.', null));
        }

        return res.send(functions.output(1, 'Bookings found.', result));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}



// cancel Booking :
async function cancelBookingByAppointmentId(req:Request,res:Response){
    const {id}=req.params;
    const functions = new Functions();
    try {
        const cancelResponse= await SlotBookingModel.cancelBookingStatus(+id);

        if(cancelResponse.status){
            return res.send(functions.output(1, 'Booking cancelled successfully.', cancelResponse));
        }
        return res.send(functions.output(0, cancelResponse.message,null));
    }
    catch(error){
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


// Get all Bookings by patientId:
async function findBookingsByPatientId(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    try {
        let {id} = req.params;
        
        const result = await SlotBookingModel.findBookingsByPatientId(+id);
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No booking found.', null));
        }

        return res.send(functions.output(1, 'Bookings found.', result));
    } catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}





// Get all Bookings by doctorId:
async function findBookingsByDoctorId(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    try {
        let {id} = req.params;
        const result = await SlotBookingModel.findBookingsByDoctorId(+id);
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No booking found.', null));
        }

        return res.send(functions.output(1, 'Bookings found.', result));
    } catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}





// Get Booked slotBy bookingId:
async function getBookingByBookingId(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    try {
        let {id} = req.params;
        
        const result = await SlotBookingModel.getBookingByBookingId(+id);
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No booking such found.', null));
        }

        return res.send(functions.output(1, 'Bookings found.', result));
    } catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}

