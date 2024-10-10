import { Request, Response, Router,NextFunction } from 'express';
import Joi from 'joi';
import { Functions } from '../library/functions';
import { validations } from '../library/validations';
import DoctorModel from '../model/dbDoctorModel';
import ClinicModel from '../model/dbClinicModel';
import SpecialtyModel from '../model/dbSpecialtyModel';
import {updateProfile} from '../controller/authController';



const joiStringRequired = Joi.string().trim().required();
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

// Admin access : Fetch all doctors 
router.get('/all_doctors', getAllDoctors); 



// Admin/doctor access : Fetch all clinics 
router.get('/all_clinics', getAllClinics); 


// Fetch doctor by ID
router.get('/get_doctor/:id', getDoctorById); 


// fetch doctors list With Specialization name or Disease name or by Doctor Name:
// eg: /searchDoctorsWithQuery?search='fever'
router.get('/search_doctors_with_query',searchDoctorsWithQuery);


/**
 * Route for searching doctors along with their schedules and clinic details.
 * @route GET /api/doctor/searchdoctors_WithAvailability_Schedules
 .eg: /api/doctors/searchdoctors_WithAvailability_Schedules?search='fever'
 * @param {string} search - The search term to look for in doctor names, specialties, or diseases.
 */
router.get('/search_doctors_with_availability_schedules', searchDoctorsWithSchedules);


// Update doctor profile
router.patch('/update_profile/:id',authorizedRoles("admin","doctor"),updateProfileValidator,updateProfile); 

// Get all specialties available
router.get('/specialties', getAllSpecialties); 


// Add clinic
router.post('/add_clinic', authorizedRoles("admin", "doctor"), addClinicValidator, addClinic); 

// Delete clinic by ID
router.delete('/delete_clinic/:id', authorizedRoles("admin"), deleteClinicById); 


//Delete doctor by ID (admin access only)
router.delete('/delete_doctor/:id', authorizedRoles("admin"), deleteDoctorById); 

export default router;

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
    const functions = new Functions();
    try {
        let result =await DoctorModel.findAllDoctorsWithSpecialties();

        if (result.length < 1) {
            return res.send(functions.output(0, 'No doctors found.', null));
        }
        
        return res.send(functions.output(1, 'Doctors found.', result));
    } catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


/**
 * Searches for doctors based on the search term.(either of one (doctorName, specialty, diseaseName)):
 * @param req : ?search='fever' The request object containing query parameters.
 * @param res The response object to send the result.
 */
async function searchDoctorsWithQuery(req: Request, res: Response): Promise<Response>  {
    const functions = new Functions();
    try {
        const searchTerm = req.query.search as string || ''; 
        const doctors = await DoctorModel.searchDoctorsWith_Specialization_Disease_DoctorName(searchTerm);

        if (doctors.length === 0) {
            return res.send(functions.output(0, 'No matching doctors found', null));
        }
        return res.send(functions.output(1, 'Matching doctors found.',doctors));
    }
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
};




/**
 * Searches for doctors along with their schedules and clinic details based on a generic query parameter.
 * @param req The request object containing the query parameter for searching.
 * @param res The response object to send the result back to the client.
 * @returns A response object containing the search results or an error message.
 */
async function searchDoctorsWithSchedules(req: Request, res: Response): Promise<Response> {
    const functions = new Functions();
    try {
        const query = req.query.search as string || ''; // Get the query from the generic parameter
        const doctorsWithSchedules = await DoctorModel.searchDoctorsWithSchedules(query);

        // Check if any doctors were found
        if (doctorsWithSchedules.length === 0) {
            return res.send(functions.output(0, 'No matching doctors found', null));
        }

        // Return the found doctors with their schedules
        return res.send(functions.output(1, 'Matching doctors found.',doctorsWithSchedules));
    }
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
};





// Function to get all doctors
async function getAllClinics(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    try {
        const result = await ClinicModel.allRecords();
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No Clinics found.', null));
        }

        return res.send(functions.output(1, 'Clinics found.', result));
    } catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


// Function to get doctor by ID
async function getDoctorById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
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
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}

// Function to get all specialties
async function getAllSpecialties(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    try {
        const result = await SpecialtyModel.allRecords();
        if (!result || result.length < 1) {
            return res.send(functions.output(0, 'No specialties found!', null));
        }

        return res.send(functions.output(1, 'Specialties found.', result));
    }
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}

// Function to add a clinic
async function addClinic(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    try {
        const clinicData = req.body;
        const result = await ClinicModel.addClinic(clinicData);

        if (!result) {
            return res.send(functions.output(0, 'Failed to add clinic.', null));
        }

        return res.send(functions.output(1, 'Clinic added successfully.', result));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}



// Function to delete clinic by ID
async function deleteClinicById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    const { id } = req.params;
    try {
        const clinic_id = Number(id);
        if (isNaN(clinic_id)) {
            return res.send(functions.output(0, 'Invalid clinic ID', null));
        }

        const result = await ClinicModel.deleteRecord(clinic_id);
        if (!result) {
            return res.send(functions.output(0, 'Clinic ID does not exist.', null));
        }

        return res.send(functions.output(1, 'Clinic deleted successfully.',result));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


// Function to delete doctor by ID (admin only)
async function deleteDoctorById(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    const functions = new Functions();
    const { id } = req.params;
    try {
        const doctor_id = Number(id);
        if (isNaN(doctor_id)) {
            return res.send(functions.output(0, 'Invalid doctor ID', null));
        }

        const result = await DoctorModel.deleteRecord(doctor_id);
        if (!result) {
            return res.send(functions.output(0, 'Doctor ID does not exist.', null));
        }

        return res.send(functions.output(1, 'Doctor deleted successfully.',result));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}
