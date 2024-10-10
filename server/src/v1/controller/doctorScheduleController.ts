import { Request, Response, Router,NextFunction } from 'express';
import Joi from 'joi';
import { Functions } from '../library/functions';
import { validations } from '../library/validations';
import DoctorScheduleModel from '../model/dbDoctorScheduleModel';
import {generateScheduleSlots} from "../controller/slotsController"


const joiStringRequired = Joi.string().trim().required();

/**
 * Middleware to authorize roles.
 * @param allowedRoles - Array of roles that are allowed access.
 */
export let authorizedRoles = (...allowedRoles: string[]) => {
    const functions=new Functions();
    return (req: Request | any, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.body.user.role)) {
            return res.send(functions.output(0, "Access Denied. User Not Authorized.", null));
        }
        next();
    };
};

// ---------------------------ROUTES---------------------------------------
const router = Router();

// get all doctors schedules...
router.get('/all_doctors_schedules',authorizedRoles("admin"), viewAllDoctorsSchedules); //tested

// add a doctor's availability schedule
router.post('/add_schedule',authorizedRoles("admin","doctor"),scheduleValidator, addSchedule);

// Route to delete a doctor's availability schedule
router.delete('/delete_schedule/:id',authorizedRoles("admin","doctor"), deleteSchedule);

// Route to get schedules by doctor ID
router.get('/doctor/:doctorId', getScheduleByDoctorId);

// Route to get schedules by doctor ID
router.get('/schedule_details/:id', getScheduleByScheduleId);

export default router;

// ---------------------------VALIDATIONS---------------------------------------

// Validation function for updating a schedule
function scheduleValidator(req: any, res: any, next: any) {
    const schema = Joi.object({
        doctor_id: Joi.number().integer().required(),
        clinic_id: Joi.number().integer().required(),
        start_time: joiStringRequired.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm format
        end_time: joiStringRequired.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
        consultation_duration: Joi.number().integer().positive().required(),
        day: joiStringRequired.valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), // Updated to array
        fee: Joi.number().integer().required(),
    });

    let validationsObj = new validations();
    if (!validationsObj.validateRequest(req, res, next, schema)) {
        return false;
    }
}

// --------------------------- FUNCTIONS------------------------------------------

// to get all doctors schedules:
async function viewAllDoctorsSchedules(req: Request, res: Response){
    const functions = new Functions();
    try {
        const result = await DoctorScheduleModel.allSchedulesRecords();
        if(result){
             return res.send(functions.output(1, 'Doctors schedules are : !', result));
        }
        else return res.send(functions.output(0, 'Doctors schedule not available!', result));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


// Function to add a doctor's availability schedule
async function addSchedule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | any> {
    const functions = new Functions();
    try {
        let { doctor_id, clinic_id, start_time, end_time, consultation_duration, day,fee } = req.body;
        
        // Check for overlapping schedules:
        const hasConflict = await DoctorScheduleModel.checkScheduleConflict(doctor_id, start_time, end_time, day);
        
        if (hasConflict) {
            return res.send(functions.output(0, 'Schedule conflict detected. Please adjust your times.', null));
        }
        
        // no conflict -> insert the schedule
        const scheduleData = {
            doctor_id,
            clinic_id,
            start_time,
            end_time,
            consultation_duration,
            day, 
            fee
        };

        const response = await DoctorScheduleModel.addSchedule(scheduleData);
        if(response){
            await generateScheduleSlots(response,res);
        }
        
        return res.send(functions.output(1, 'Doctor schedule updated successfully!', response));
    } 
    catch (error) {
        return res.send(functions.output(0,"Internal Server Error", error));
    }
}



// Function to delete a doctor's availability schedule
async function deleteSchedule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | any> {
    const functions = new Functions();
    try {
        const { id } = req.params;

        const isDeleted = await DoctorScheduleModel.deleteSchedule(parseInt(id));
        if (!isDeleted) {
            return res.send(functions.output(0, 'Failed to delete schedule', null));
        }

        return res.send(functions.output(1, 'Schedule deleted successfully', null));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}



// Function to get schedules by doctor ID
async function getScheduleByDoctorId(req: Request, res: Response): Promise<Response<any, Record<string, any>> | any> {
    const functions = new Functions();
    try {
        const { doctorId } = req.params;
        const schedules = await DoctorScheduleModel.getScheduleByDoctorId(parseInt(doctorId));
        if(schedules){
            return res.send(functions.output(1, 'Schedules retrieved successfully', schedules));
        }
        else return res.send(functions.output(0, 'No Schedule available for the doctor.!', schedules));
        
    } catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}




// Function to get schedules by doctor ID
async function getScheduleByScheduleId(req: Request, res: Response): Promise<Response<any, Record<string, any>> | any> {
    const functions = new Functions();
    try {
        const { id } = req.params;
        const schedules = await DoctorScheduleModel.getScheduleById(parseInt(id));
        if(schedules){
            return res.send(functions.output(1, 'Schedule details retrieved successfully', schedules));
        }
        else return res.send(functions.output(0, 'Schedule not available. Check id.', schedules));
        
    } catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}
