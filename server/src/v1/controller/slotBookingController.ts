import { Request, Response, Router,NextFunction } from 'express';
import { Functions } from '../library/functions';
import SlotBookingModel from '../model/dbSlotBookingModel';
import SlotsModel from '../model/dbSlotsModel';

const functions = new Functions();

/**
 * Middleware to authorize roles.
 * @param allowedRoles - Array of roles that are allowed access.
 */
export let authorizedRoles = (...allowedRoles: string[]) => {
    return (req: Request | any, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.body.user.role)) {
            return res.send(functions.output(0,"Access denied",null));
        }
        next();
    };
};

// ---------------------------ROUTES---------------------------------------
const slotBookingRouter = Router();

//get all bookings : admin acees only:
slotBookingRouter.get('/getAllBookings', authorizedRoles('admin'), getAllBookedSlots); //tested

//get getBookedSlotByBookingId:
slotBookingRouter.get('/getBookingByBookingId/:id', getBookingByBookingId);  //tested

//get getBookedSlotByBookingId:
slotBookingRouter.get('/getAllBookingsByDoctorId/:id',authorizedRoles("doctor","admin"), findBookingsByDoctorId);  //tested


//get getBookedSlotByBookingId:
slotBookingRouter.get('/getAllBookingsByPatientId/:id',authorizedRoles("patient","admin"), findBookingsByPatientId); //tested


//book a new slot
// @param: slot_id 
slotBookingRouter.post('/booknewSlot/:id',authorizedRoles("patient"), makeBookingBySlotId);  //tested


//cancel the slot by appointment id:
slotBookingRouter.patch('/cancelBookedSlot/:id', cancelBookingByAppointmentId);  //tested


export default slotBookingRouter;

// --------------------------- FUNCTIONS------------------------------------------


// to book a slot based on slotId:
async function makeBookingBySlotId(req: Request, res: Response) {
    try {
        const { id: slotID } = req.params;
        const { id: patient_id } = req.body.user;

        const slotDetail = await SlotsModel.getSlotDetailsBySlotID(+slotID);

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
    try {
        const result = await SlotBookingModel.findAllBookings();
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
    try{
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

