import { Request, Response, Router, NextFunction } from 'express';
import Joi from 'joi';
import { Functions } from '../library/functions';
import PaymentModel, { Payment } from '../model/dbPaymentModel';
import { validations } from '../library/validations';


const functions = new Functions();

//---------------------Middleware---------------------------------

/**
 * Middleware to authorize roles.
 * @param allowedRoles - Array of roles that are allowed access.
 */
export let authorizedRoles = (...allowedRoles: string[]) => {
    return (req: Request | any, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.body.user.role)) {
            return res.send(functions.output(0, "Access Denied. User Not Authorized.", null));
        }
        next();
    };
};



// --------------------Validation-------------------------------------

// Validation function for payment
function paymentSchema(req: any, res: any, next: any){
    const schema = Joi.object({
    appointment_id: Joi.number().integer().required(),
    amount: Joi.number().precision(2).positive().required(),
    payment_status: Joi.string().valid('pending', 'completed', 'failed').required(),
    });
    
    let validationsObj = new validations();
    if (!validationsObj.validateRequest(req, res, next, schema)) {
        return false;
    }
}


// Validation function for appointment ID
function appointmentIdSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        id: Joi.number().integer().required(),
    });

    let validationsObj = new validations();
    if (!validationsObj.validateRequest(req, res, next, schema)) {
        return false;
    }
}

//-------------------Routes--------------------------------------------

const paymentRouter = Router();

// Create a new payment
paymentRouter.post('/createPayment', authorizedRoles('patient'),paymentSchema, createPayment);

// get all payments: ADMIN ACCESS
paymentRouter.get('/getAllPayments', authorizedRoles('admin'), getAllPayments);


// get payment detail by doctorId: Doctor admin access
paymentRouter.get('/getPaymentsByDoctorId/:id', authorizedRoles('doctor','admin'),appointmentIdSchema, getPaymentsByDoctorId);


//get payment status by patientId: Patient admin access
paymentRouter.get('/getPaymentsByPatientId/:id', authorizedRoles('patient','admin'),appointmentIdSchema, getPaymentsByPatientId);


//get paymnet status by appointment id:
paymentRouter.get('/getPaymentByAppoitmnentId/:id',appointmentIdSchema,  getPaymentByAppointmentId);


export default paymentRouter;


//-------------------------------Functions-----------------------------------------------------
// Function to create a payment
async function createPayment(req: Request, res: Response) {
    try {
        const paymentData: Payment = req.body;
        const result = await PaymentModel.createPayment(paymentData);
        if (result) {
            return res.send(functions.output(1, 'Payment created successfully!', result));
        }
        return res.send(functions.output(0, 'Failed to create payment.', null));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}



// Function to get all payments
async function getAllPayments(req: Request, res: Response) {
    try {
        const payments = await PaymentModel.getAllPayments();
        return res.send(functions.output(1, 'All payments retrieved successfully', payments));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}



// Function to get payments by doctor ID
async function getPaymentsByDoctorId(req: Request, res: Response) {
    const { id } = req.params;
    try {
        const payments = await PaymentModel.getPaymentsByDoctorId(+id);
        if (payments.length > 0) {
            return res.send(functions.output(1, 'Payments retrieved successfully', payments));
        }
        return res.send(functions.output(0, 'No payments found for this doctor.', null));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}

// Function to get payments by patient ID
async function getPaymentsByPatientId(req: Request, res: Response) {
    const { id } = req.params;
    try {
        const payments = await PaymentModel.getPaymentsByPatientId(+id);
        if (payments.length > 0) {
            return res.send(functions.output(1, 'Payments retrieved successfully', payments));
        }
        return res.send(functions.output(0, 'No payments found for this patient.', null));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}

// Function to get payment by appointment ID
async function getPaymentByAppointmentId(req: Request, res: Response) {
    const { id } = req.params;
    try {
        const payment = await PaymentModel.getPaymentByAppointmentId(+id);
        if (payment) {
            return res.send(functions.output(1, 'Payment found', payment));
        }
        return res.send(functions.output(0, 'No payment found for this appointment ID.', null));
    } 
    catch (error) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}