import { Request, Response,Router} from 'express'; 
import Joi from 'joi';
import { Functions } from '../library/functions';
import { validations } from '../library/validations';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from "../model/dbAuthModel";


const joiStringRequired = Joi.string().trim().required();

// ---------------------------ROUTES---------------------------------------

const router = Router();

//will signup for admin from backend...this signup works only for doctors/patients
router.post('/signup', signup_Joi_Validator, signup);
//login all roles:
router.post('/login', login_Joi_Validator, login);

export default router;


// ---------------------------VALIDATIONS---------------------------------------
/**
 * Validation function for signup route
 */
function signup_Joi_Validator(req: any, res: any, next: any){
    const schema = Joi.object({     
    role: joiStringRequired.valid('doctor', 'patient'),
    name: joiStringRequired.min(2),
    mobile: joiStringRequired.min(10).length(10).pattern(/^[6-9][0-9]{9}$/),
    email: joiStringRequired.email(),
    password: joiStringRequired.min(6).max(12)
    });
    
    let validationsObj = new validations();
  if (!validationsObj.validateRequest(req, res, next, schema)) {
    return false;
  }
} 
  
 /**
 * Validation function for login route:
 */
  function login_Joi_Validator(req: any, res: any, next: any) {
  const schema = Joi.object({
    role: joiStringRequired.valid('admin', 'doctor', 'patient'),
    mobile: joiStringRequired,
    password: joiStringRequired,
  })
  let validationsObj = new validations();
  if (!validationsObj.validateRequest(req, res, next, schema)) {
    return false;
  }
}

// --------------------------- FUNCTIONS------------------------------------------

  /**
 * Function for signup
 */
  async function signup(req: Request, res: Response):Promise<Response<any, Record<string, any>> | any>  {
    const functions = new Functions(); 
    try {
       const { role,name,mobile, email, password } = req.body;

       const existingUser = await userModel.findUserByMobile({role,mobile});
      
      if (existingUser) {
        return res.send(functions.output(0, 'Mobile number already registered. Either Login or register with new mobile number.', null));; 
      }
      
      const user: []  = await userModel.createUser({ role,name, mobile, email, password});
     
      return res.send(functions.output(1, 'User created successfully', user));
    } catch (error) {
      return res.send(functions.output(0, 'Internal Server Error', error));
    }
  }



   /**
 * Function for login
 */
  async function  login(req: Request, res: Response):Promise<Response<any, Record<string, any>> | any> {   
    const functions = new Functions();
    try {
         const {role, mobile, password } = req.body;
      const user:any = await userModel.findUserByMobile({role,mobile});
      if (!user || !(await bcrypt.compare(password, user.password!))) {
        if(!user){
            return res.send(functions.output(0, 'Invalid credentials. User Not Exists.', null));; 
        }
        else{
            return res.send(functions.output(0, 'Invalid credentials. Incorrect Password.', null));; 
        }
      }
      
       // Dynamically get the user ID based on the role
        let userId:number = 0;
        if (role === 'admin') {
            userId = user.admin_id; 
        } else if (role === 'doctor') {
            userId = user.doctor_id; 
        } else if (role === 'patient') {
            userId = user.patient_id; 
        }
       
        
        const token = jwt.sign({
            role: role,
            id: userId,
            name: user.name,
            mobile: user.mobile,
            email: user.email
        }, process.env.JWT_SECRET!, { expiresIn: '24h' });

      const  {password:_,...userData}=user;

      return res.send(functions.output(1, 'Login Successful..', {token,role,...userData}));
    } catch (error) {
      return res.send(functions.output(0,'Internal server error' ,error));
    }
  }



/**
 * Function for users update
 */
export async function updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | any> {
  const functions = new Functions();  
  try {
        const userId = parseInt(req.params.id); // ID from the URL
        const roleFromParams = req.baseUrl.split('/')[3]; // Role from URL

        let tableName : string = "";
        if (roleFromParams === 'doctor' || roleFromParams === 'patient') {
            tableName = roleFromParams;
        } else {
            return res.send(functions.output(0, "Invalid process.. access denied!", null));
        }

        const updates = req.body;

        // Check if there are any fields left to update
        if (Object.keys(updates).length === 0) {
                return res.send(functions.output(0, "No fields to update!", null));
        }

        const result = await userModel.updateUserProfile(tableName, userId, updates);
        if(!result){
          return res.send(functions.output(0, "User id not found . Can't update!",null));
        }
        else{
          return res.send(functions.output(1, "User data updated!",result));
        }

    } catch (error: any) {
        return res.send(functions.output(0, 'Internal Server Error', error));
    }
}


