import { Request, Response, Router,NextFunction } from 'express';
import Joi from 'joi';
import { Functions } from '../library/functions';
import { validations } from '../library/validations';
import SlotsModel,{SlotsAvailability} from '../model/dbSlotsModel';

const functions = new Functions();

/**
 * Middleware to authorize roles.
 * @param allowedRoles - Array of roles that are allowed access.
 */
export let authorizedRoles = (...allowedRoles: string[]) => {
    return (req: Request | any, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.body.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
};

// ---------------------------ROUTES---------------------------------------
const slotsRouter = Router();

//get slots : only admin:
slotsRouter.get('/getallSlots',authorizedRoles("admin"),getAllSlots); 

//get slots by doctors id:
slotsRouter.get('/getSlotsByDoctorId/:doctorId',getSlotsByDoctorId);

//get slots by availability:
slotsRouter.get('/getSlotsByAvailability',getSlotsByAvailability);


//get slots by SlotId:
slotsRouter.get('/getSlotBySlotId/:id',getSlotsBySlotId);


// get doctors by speciality or by disease or doc name or all:
slotsRouter.get('/getdoctorsonSearch',getAllDoctorsBySpecialtyOrDiseaseName);

export default slotsRouter;

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
    try{
        const {id}=req.params;
        const slotDetails = await SlotsModel.getSlotDetailsBySlotID(+id);
        if(slotDetails){
           return res.send(functions.output(1, 'Slot found:', slotDetails));
        }
        else{
            return res.send(functions.output(0, 'Slot not found. Chekc id.', slotDetails));
        }
    }
    catch(error){
        console.log("error at getting slot.")
        return res.send(functions.output(0, error));;
    }
}


// generate slots based on id of schedule:
export async function generateScheduleSlots(schedule: any, res: Response): Promise<Response<any>> {
    try {
        const { id, doctor_id, clinic_id, start_time, end_time, consultation_duration, day, fee } = schedule;

        // Get the slot date for the specified day
        const resultantDate = await functions.getSlotDate(day); // This returns a Date object
        const date = functions.formatDateToLocalString(resultantDate); // Use the helper function
        
        // Generate time slots based on the schedule details
        const slotsArray = functions.generateTimeSlots(start_time, end_time, consultation_duration);
        console.log("slotsArray: ", slotsArray);
        
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

        console.log("Generated slots: ", slots);

        // Insert slots into the database
        const result = await SlotsModel.storeSlotsForSchedule(slots);

        // Check if any slots were inserted
        if (result && result.length > 0) {
            return res.send(functions.output(1, 'Schedule and Slots created successfully!', result));
        }

        // Handle the case where no slots were inserted
        return res.send(functions.output(0, 'No slots created!', null));
    } catch (error) {
        console.error('Error creating slots:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}


//get All slots: admin power:
async function getAllSlots(req: Request, res: Response){
    try {
        const slots = await SlotsModel.getAllSlots();
        if(slots.length<0){
            return res.send(functions.output(0, 'No Slots Found...', slots));
        }
        else return res.send(functions.output(1, 'All slots retrieved successfully', slots));                
    } catch (error) {
        console.error('Error fetching all slots:', error);
        return res.send(functions.output(0, error, null));
    }
}

// get slots by doctor ID
async function getSlotsByDoctorId(req: Request, res: Response){
    try {
        const doctorId = parseInt(req.params.doctorId, 10);
        const slots = await SlotsModel.getSlotsByDoctorId(doctorId);
        if(slots.length<1){
            return res.send(functions.output(0, 'No Slot available for the doctor.', slots));
        }
        else return res.send(functions.output(1, 'Slots retrieved for doctor', slots));
    } catch (error) {
        console.error('Error fetching slots by doctor ID:', error);
        return res.send(functions.output(0, error, null));
    }
};


// get slot by availability:
async function getSlotsByAvailability(req: Request, res: Response){
    try {
        const slots =await SlotsModel.getSlotsByAvailability();
        if(slots.length<1){
            return res.send(functions.output(0, 'No Slots Found...', slots));
        }
        else{
            console.log("slots are: ",slots);
            return res.send(functions.output(1, 'Slots retrieved for doctor', slots));
        } 
    }
    catch(error){
        console.error('Error fetching slots by availability:', error);
        return res.send(functions.output(0, error, null));
    }
}


//get doctors with available slots for a disease:
async function getAllDoctorsBySpecialtyOrDiseaseName(req: Request, res: Response){
    try{
        const searchQuery = req.body||'*';
        const result =await SlotsModel.getDoctorsWithAvailableSlots(searchQuery);
        console.log("result in slot controller doc by speciality: ",result)

        if(result){
            return res.send(functions.output(1,"Output: ",result));
        }
        else{
            return res.send(functions.output(0,"Failed to fetch..Try again later ",result));
        }

    }
    catch(error){
        console.error('Error fetching doctors with available slots:', error);
        return res.send(functions.output(0, error, null));
    }
}