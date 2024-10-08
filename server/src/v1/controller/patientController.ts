import { Request, Response, Router,NextFunction } from 'express';
import Joi from 'joi';
import { Functions } from '../library/functions';
import { validations } from '../library/validations';
import PatientModel from '../model/dbPatientModel';
import { constants } from '../constants'
import { updateProfile } from './authController';

const { joiStringOptional } = constants;
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
const patientRouter = Router();

// Route to fetch all patients (admin access only)
patientRouter.get('/allpatients', authorizedRoles("admin"), getAllPatients); //tested

// Route to fetch a patient by ID
patientRouter.get('/getPatient/:id', getPatientById); //tested

// Route to update a patient's profile
patientRouter.patch('/updateprofile/:id', authorizedRoles("admin","patient"),updateProfileValidator, updateProfile); //tested

// Route to delete a patient by ID (admin access only)
patientRouter.delete('/deletePatient/:id', authorizedRoles("admin"), deletePatientById); //tested


export default patientRouter;

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
    try {
        let result = await PatientModel.findAllPatients();
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No patients found.', null));
        }
        // Filter out Password fields from Array of object:
        result = functions.filterPassword(result);
        return res.send(functions.output(1, 'Patients found.', result));
    } catch (error) {
        console.error('Error fetching patients:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}

// Function to retrieve a specific patient by their ID
async function getPatientById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const { id } = req.params;

    try {
        const patient_id = Number(id);
        if (isNaN(patient_id)) {
            return res.send(functions.output(0, 'Invalid patient ID', null));
        }

        const result = await PatientModel.findPatientById(patient_id);
        if (!result) {
            return res.send(functions.output(0, 'No such patient exists.', null));
        }
        delete result.password;  //removing password
        return res.send(functions.output(1, 'Patient found.', result));
    } catch (error) {
        console.error('Error fetching patient by ID:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}

// Function to delete a patient by their ID (admin access only)
async function deletePatientById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const { id } = req.params;

    try {
        const patient_id = Number(id);
        if (isNaN(patient_id)) {
            return res.send(functions.output(0, 'Invalid patient ID', null));
        }

        const result = await PatientModel.deletePatientById(patient_id);
        if (!result) {
            return res.send(functions.output(0, 'Patient ID does not exist.', null));
        }

        return res.send(functions.output(1, 'Patient deleted successfully.'));
    } catch (error) {
        console.error('Error deleting patient:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}

