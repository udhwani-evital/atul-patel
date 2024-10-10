import { Request, Response, Router,NextFunction } from 'express';
import Joi from 'joi';
import { Functions } from '../library/functions';
import { validations } from '../library/validations';
import PatientModel from '../model/dbPatientModel';
import { updateProfile } from './authController';


const joiStringOptional= Joi.string().trim();

/**
 * Middleware to authorize roles.
 * @param allowedRoles - Array of roles that are allowed access.
 */
export let authorizedRoles = (...allowedRoles: string[]) => {
    const functions = new Functions();
    return (req: Request | any, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.body.user.role)) {
            return res.send(functions.output(0, "Access Denied. User Not Authorized.", null));
        }
        next();
    };
};
// ---------------------------ROUTES---------------------------------------
const router = Router();

// Route to fetch all patients (admin access only)
router.get('/all_patients', authorizedRoles("admin"), getAllPatients); //tested

// Route to fetch a patient by ID
router.get('/get_patient/:id', getPatientById); //tested

// Route to update a patient's profile
router.patch('/update_profile/:id', authorizedRoles("admin","patient"),updateProfileValidator, updateProfile); //tested

// Route to delete a patient by ID (admin access only)
router.delete('/delete_patient/:id', authorizedRoles("admin"), deletePatientById); //tested


export default router;

// ---------------------------VALIDATIONS---------------------------------------

// Validation function for updating a patient profile
function updateProfileValidator(req: any, res: any, next: any) {
    const schema = Joi.object({
        name: joiStringOptional.min(2),
        email: joiStringOptional.email(),
        address: joiStringOptional,
        gender: joiStringOptional.valid('Male','MALE','male','Female','FEMALE', 'female', 'other'),
        medical_history: joiStringOptional,
        age: Joi.number().integer().optional(),
    });

    const validationsObj = new validations();
    if (!validationsObj.validateRequest(req, res, next, schema)) {
        return false; // Terminate if validation fails
    }
}

// --------------------------- FUNCTIONS------------------------------------------

// Function to get all patients from the database
async function getAllPatients(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    try {
        let result = await PatientModel.findAllPatients();
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No patients found.', null));
        }
        
        return res.send(functions.output(1, 'Patients found.', result));
    }
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}



// Function to retrieve a specific patient by their ID
async function getPatientById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const { id } = req.params;

    const functions = new Functions();
    try {
        const patient_id = Number(id);
        if (isNaN(patient_id)) {
            return res.send(functions.output(0, 'Invalid patient ID', null));
        }

        const result = await PatientModel.findPatientById(patient_id);
        if (!result) {
            return res.send(functions.output(0, 'No such patient exists.', null));
        }
        return res.send(functions.output(1, 'Patient found.', result));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}



// Function to delete a patient by their ID (admin access only)
async function deletePatientById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const { id } = req.params;

    const functions = new Functions();
    try {
        const patient_id = Number(id);
        if (isNaN(patient_id)) {
            return res.send(functions.output(0, 'Invalid patient ID', null));
        }

        const result = await PatientModel.deletePatientById(patient_id);
        if (!result) {
            return res.send(functions.output(0, 'Patient ID does not exist.', null));
        }

        return res.send(functions.output(1, 'Patient deleted successfully.',result));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}

