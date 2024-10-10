import { Request, Response, Router,NextFunction } from 'express';
import Joi from 'joi';
import { Functions } from '../library/functions';
import { validations } from '../library/validations';
import SlotsModel,{SlotsAvailability} from '../model/dbSlotsModel';


/**
 * Middleware to authorize roles.
 * @param allowedRoles - Array of roles that are allowed access.
 */
export let authorizedRoles = (...allowedRoles: string[]) => {
    const functions = new Functions();
    return (req: Request | any, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.body.user.role)) {
            return res.send(functions.output(0, 'Access denied', null));
        }
        next();
    };
};

// ---------------------------ROUTES---------------------------------------
const router = Router();

//get slots : only admin:
router.get('/get_all_slots',authorizedRoles("admin"),getAllSlots); 

//get slots by doctors id:
router.get('/get_slots_by_doctor_id/:doctorId',getSlotsByDoctorId);

//get slots by availability:
router.get('/get_slots_by_availability',getSlotsByAvailability);


//get slots by SlotId:
router.get('/get_slot_by_slot_id/:id',getSlotsBySlotId);


// get doctors by speciality or by disease or doc name or all:
router.get('/get_doctors_on_Search',getAllDoctorsBySpecialtyOrDiseaseName);

export default router;

// ---------------------------VALIDATIONS---------------------------------------

// Validation function for updating a schedule
function slotSchemaValidator(req: any, res: any, next: any) {
    const schema = Joi.object({
    schedule_id: Joi.number().integer().required(),
    doctor_id: Joi.number().integer().required(),
    clinic_id: Joi.number().integer().required(),
    slot_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(), // HH:MM or HH:MM:SS format
    slot_duration: Joi.number().integer().positive().required(), // Duration in minutes
    slot_date: Joi.date().iso().required(), // ISO date format
    status: Joi.string().valid('booked', 'available', 'cancelled').required(),
    fee: Joi.number().integer().positive().required() // Fee for the consultation
});

    let validationsObj = new validations();
    if (!validationsObj.validateRequest(req, res, next, schema)) {
        return false;
    }
}

// --------------------------- FUNCTIONS------------------------------------------




//get slot by slost id:
export async function getSlotsBySlotId(req:Request,res:Response){
    const functions = new Functions();
    try {
        const {id}=req.params;
        SlotsModel.where=`where id=${parseInt(id)}`
        const slotDetails = await SlotsModel.allRecords('*');
        if(slotDetails){
           return res.send(functions.output(1, 'Slot found:', slotDetails));
        }
        else{
            return res.send(functions.output(0, 'Slot not found. Chekc id.', slotDetails));
        }
    }
    catch (error) {        
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


// generate slots based on id of schedule:
export async function generateScheduleSlots(schedule: any, res: Response): Promise<Response<any>> {
    const functions = new Functions();
    try {
        const { id, doctor_id, clinic_id, start_time, end_time, consultation_duration, day, fee } = schedule;

        // Get the slot date for the specified day
        const resultantDate = await functions.getSlotDate(day); // This returns a Date object
        const date = functions.formatDateToLocalString(resultantDate); // Use the helper function
        
        // Generate time slots based on the schedule details
        const slotsArray = functions.generateTimeSlots(start_time, end_time, consultation_duration);
        
        
        const slots: SlotsAvailability[] = slotsArray.map(slotTime => ({
            schedule_id: Number(id),
            doctor_id,
            clinic_id,
            slot_time: slotTime,
            slot_duration: consultation_duration,
            slot_date: date,
            status: 'available',
            fee
        }));
        

        // Insert slots into the database
        const result = await SlotsModel.storeSlotsForSchedule(slots);

        // Check if any slots were inserted
        if (result && result.length > 0) {
            return res.send(functions.output(1, 'Schedule and Slots created successfully!', result));
        }

        // Handle the case where no slots were inserted
        return res.send(functions.output(0, 'No slots created!', null));
    }
    catch (error) {        
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


//get All slots: admin power:
async function getAllSlots(req: Request, res: Response){
    const functions = new Functions();
    try {
        const slots = await SlotsModel.allRecords('*');
        if(slots.length<0){
            return res.send(functions.output(0, 'No Slots Found...', slots));
        }
        else return res.send(functions.output(1, 'All slots retrieved successfully', slots));                
    }
    catch (error) {        
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}



// get slots by doctor ID
async function getSlotsByDoctorId(req: Request, res: Response){
    const functions = new Functions();
    try {
        const doctorId = parseInt(req.params.doctorId, 10);
        SlotsModel.where = `where doctor_id=${doctorId}`;
        const slots = await SlotsModel.allRecords('*');
        if(slots.length<1){
            return res.send(functions.output(0, 'No Slot available for the doctor.', slots));
        }
        else return res.send(functions.output(1, 'Slots retrieved for doctor', slots));
    }
    catch (error) {        
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
};


// get slot by availability:
async function getSlotsByAvailability(req: Request, res: Response){
    const functions = new Functions();
    try {
        SlotsModel.where = `where status='available' OR status='cancelled'`;
        const slots =await SlotsModel.allRecords('*');
        if(slots.length<1){
            return res.send(functions.output(0, 'No Slots Found...', slots));
        }
        else{
            return res.send(functions.output(1, 'Slots retrieved for doctor', slots));
        } 
    }
    catch (error) {        
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


//get doctors with available slots for a disease:
async function getAllDoctorsBySpecialtyOrDiseaseName(req: Request, res: Response){
    const functions = new Functions();
    try {
        const searchQuery = req.body||'*';
        const result =await SlotsModel.getDoctorsWithAvailableSlots(searchQuery);

        if(result){
            return res.send(functions.output(1,"Output: ",result));
        }
        else{
            return res.send(functions.output(0,"Failed to fetch..Try again later ",result));
        }

    }
    catch (error) {        
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}