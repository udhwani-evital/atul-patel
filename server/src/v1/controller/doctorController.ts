import { Request, Response, Router,NextFunction } from 'express';
import Joi from 'joi';
import { Functions } from '../library/functions';
import { validations } from '../library/validations';
import DoctorModel from '../model/dbDoctorModel';
import {updateProfile} from '../controller/authController';
import {constants} from "../constants"

const functions = new Functions();

const {joiStringOptional,joiStringRequired}=constants;
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
const doctorRouter = Router();

// Admin access : Fetch all doctors 
doctorRouter.get('/alldoctors', getAllDoctors); //tested



// Admin/doctor access : Fetch all clinics 
doctorRouter.get('/allclinics', getAllClinics); //tested


// Fetch doctor by ID
doctorRouter.get('/getDoctor/:id', getDoctorById); //tested


// fetch doctors list With Specialization name or Disease name or by Doctor Name:
// eg: /searchDoctorsWithQuery?search='fever'
doctorRouter.get('/searchDoctorsWithQuery',searchDoctorsWithQuery);


/**
 * Route for searching doctors along with their schedules and clinic details.
 * @route GET /api/doctor/searchdoctors_WithAvailability_Schedules
 .eg: /api/doctors/searchdoctors_WithAvailability_Schedules?search='fever'
 * @param {string} search - The search term to look for in doctor names, specialties, or diseases.
 */
doctorRouter.get('/searchdoctors_WithAvailability_Schedules', searchDoctorsWithSchedules);


// Update doctor profile
doctorRouter.patch('/updateprofile/:id',authorizedRoles("admin","doctor"),updateProfileValidator,updateProfile); //tested

// Get all specialties available
doctorRouter.get('/specialties', getAllSpecialties); //tested


// Add clinic
doctorRouter.post('/addclinic', authorizedRoles("admin", "doctor"), addClinicValidator, addClinic); //tested

// Delete clinic by ID
doctorRouter.delete('/deleteclinic/:id', authorizedRoles("admin"), deleteClinicById); //tested


//Delete doctor by ID (admin access only)
doctorRouter.delete('/deleteDoctor/:id', authorizedRoles("admin"), deleteDoctorById); //tested

export default doctorRouter;

// ---------------------------VALIDATIONS---------------------------------------
export interface SlotEntry {
    date?: string;
    day: string;
    startFrom: string; 
    endTime: number; 
    fee: number; 
}

interface Clinic {
    clinic_id?: number;
    name: string;
    address: string;
}

export interface DoctorWithSlots {
    doctor_id?: number;
    name: string;
    specialty: string;
    covered_diseases: string;
    clinic: Clinic;
    slots: SlotEntry[];
}


// Validation for updating a doctor profile
function updateProfileValidator(req: any, res: any, next: any) {
       const schema = Joi.object({
        name: joiStringOptional.min(2),
        email: joiStringOptional.email(),
        address: joiStringOptional,    
        registration_number: joiStringOptional,
        gender:joiStringOptional.valid('Male','MALE','male','Female','FEMALE', 'female', 'other'),
        qualifications:joiStringOptional,
        year_of_experience: Joi.number().optional(),
        specialty_id: Joi.number().optional()
    });

    let validationsObj = new validations();
    if (!validationsObj.validateRequest(req, res, next, schema)) {
        return false;
    }
}

// Validation for adding a clinic
function addClinicValidator(req: any, res: any, next: any) {
    const schema = Joi.object({
        name: joiStringRequired,
        address: joiStringRequired,
        contact_number: joiStringRequired.min(10).max(10),
    });

    let validationsObj = new validations();
    if (!validationsObj.validateRequest(req, res, next, schema)) {
        return false;
    }
}

// --------------------------- FUNCTIONS------------------------------------------

// Function to get all doctors
async function getAllDoctors(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
        let result =await DoctorModel.findAllDoctorsWithSpecialties();
          console.log("result 0 of ...: ",result)
        if (result.length < 1) {
              console.log("result 1 of ...: ",result)
            return res.send(functions.output(0, 'No doctors found.', null));
        }
        console.log("result of ...: ",result)
        // Filter out Password fields from Array of object:
        result = functions.filterPassword(result);
          console.log("result 3 of ...: ",result)
        return res.send(functions.output(1, 'Doctors found.', result));
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}


/**
 * Searches for doctors based on the search term.(either of one (doctorName, specialty, diseaseName)):
 * @param req : ?search='fever' The request object containing query parameters.
 * @param res The response object to send the result.
 */
async function searchDoctorsWithQuery(req: Request, res: Response): Promise<Response>  {
    try {
        const searchTerm = req.query.search as string || ''; 
        const doctors = await DoctorModel.searchDoctorsWith_Specialization_Disease_DoctorName(searchTerm);

        if (doctors.length === 0) {
            return res.status(404).json({ success: false, message: 'No matching doctors found.' });
        }

        return res.status(200).json({ success: true, message: 'Matching doctors found.', data: doctors });
    } catch (error) {
        console.error("Error searching for doctors: ", error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};




/**
 * Searches for doctors along with their schedules and clinic details based on a generic query parameter.
 * @param req The request object containing the query parameter for searching.
 * @param res The response object to send the result back to the client.
 * @returns A response object containing the search results or an error message.
 */
async function searchDoctorsWithSchedules(req: Request, res: Response): Promise<Response> {
    try {
        const query = req.query.search as string || ''; // Get the query from the generic parameter
        const doctorsWithSchedules = await DoctorModel.searchDoctorsWithSchedules(query);

        // Check if any doctors were found
        if (doctorsWithSchedules.length === 0) {
            return res.status(404).json({ success: false, message: 'No matching doctors found.' });
        }

        // Return the found doctors with their schedules
        return res.status(200).json({ success: true, message: 'Matching doctors found.', data: doctorsWithSchedules });
    } catch (error) {
        console.error("Error searching for doctors with schedules: ", error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};





// Function to get all doctors
async function getAllClinics(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
        const result = await DoctorModel.findAllClinics();
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No Clinics found.', null));
        }

        return res.send(functions.output(1, 'Clinics found.', result));
    } catch (error) {
        console.error('Error fetching Clinics:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}

// Function to get doctor by ID
async function getDoctorById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const { id } = req.params;

    try {
        const doctor_id = Number(id);
        if (isNaN(doctor_id)) {
            return res.send(functions.output(0, 'Invalid doctor ID', null));
        }

        const result = await DoctorModel.findDoctorById(doctor_id);
       if (!result || result==null||undefined) {
            return res.send(functions.output(0, 'Doctor not Found. Incorrect doctor Id.', null));
        }
        delete result.password;
        return res.send(functions.output(1, 'Doctor found.', result));
    } catch (error) {
        console.error('Error fetching doctor by ID:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}

// Function to get all specialties
async function getAllSpecialties(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
        const result = await DoctorModel.findAllSpecialties();
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No specialties found!', null));
        }

        return res.send(functions.output(1, 'Specialties found.', result));
    } catch (error) {
        console.error('Error fetching specialties:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}

// Function to add a clinic
async function addClinic(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
        const clinicData = req.body;
        const result = await DoctorModel.addClinic(clinicData);

        if (!result) {
            return res.send(functions.output(0, 'Failed to add clinic.', null));
        }

        return res.send(functions.output(1, 'Clinic added successfully.', result));
    } catch (error) {
        console.error('Error adding clinic:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}

// Function to delete clinic by ID
async function deleteClinicById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const { id } = req.params;

    try {
        const clinic_id = Number(id);
        if (isNaN(clinic_id)) {
            return res.send(functions.output(0, 'Invalid clinic ID', null));
        }

        const result = await DoctorModel.deleteClinic(clinic_id);
        if (!result) {
            return res.send(functions.output(0, 'Clinic ID does not exist.', null));
        }

        return res.send(functions.output(1, 'Clinic deleted successfully.'));
    } catch (error) {
        console.error('Error deleting clinic:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}


// Function to delete doctor by ID (admin only)
async function deleteDoctorById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const { id } = req.params;

    try {
        const doctor_id = Number(id);
        if (isNaN(doctor_id)) {
            return res.send(functions.output(0, 'Invalid doctor ID', null));
        }

        const result = await DoctorModel.deleteDoctorById(doctor_id);
        if (!result) {
            return res.send(functions.output(0, 'Doctor ID does not exist.', null));
        }

        return res.send(functions.output(1, 'Doctor deleted successfully.'));
    } catch (error) {
        console.error('Error deleting doctor:', error);
        return res.send(functions.output(0, 'Internal Server Error', null));
    }
}
