import express,{Request,Response,NextFunction} from "express";
import jwt from "jsonwebtoken";
import authRouter from "./controller/authController";
import doctorRouter from "./controller/doctorController";
import patientRouter from "./controller/patientController";
import doctorScheduleRouter from "./controller/doctorScheduleController";
import slotsRouter from "./controller/slotsController";
import slotBookingRouter from "./controller/slotBookingController";
import paymentRouter from './controller/paymentController';

const router = express.Router();

/**
 * Token validation middleware..decode and assign decoded token to req.body.user.
 */
export let tokenValidator = (req: Request | any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (typeof authHeader === 'string' && authHeader.startsWith("Bearer")) {
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).send({ message: 'Access denied. No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!);
            // Add the decoded token information to the request body
            req.body.user = decoded; // {"role","id","name","mobile","email","iat","exp"}
            next(); 
        } catch (error) {
            return res.status(400).send({ message: 'Invalid token.' });
        }
    } else {
        return res.status(401).send({ message: 'Access denied. No token provided' });
    }
};





router.use('/api/auth',authRouter);

router.use(tokenValidator);

/*
 * Primary app routes.
 */
router.use('/api/doctor',doctorRouter);
router.use('/api/patient', patientRouter);
router.use('/api/doctorSchedule',doctorScheduleRouter);
router.use('/api/slot',slotsRouter);
router.use('/api/slotBooking',slotBookingRouter);
router.use('/api/payments',paymentRouter);


module.exports = router;
