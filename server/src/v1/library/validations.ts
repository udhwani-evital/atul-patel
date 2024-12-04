import { Functions } from "./functions";
import { ObjectSchema } from 'joi';
import Joi from 'joi';


export class validations {
    constructor() { }

    /**
     * Function to check requested parameters received or not
     * @param fields fields array to be check for validations
     * @param req req.body object
     * @param res response to be send through
     */
    validate(fields: any, req: any, res: any) {
        let errorfields: any = new Array();
        for (let key in fields) {
            if (req[fields[key]] == undefined || String(req[fields[key]]).trim() == '') {
                errorfields.push(fields[key]);
            }
        }

        if (errorfields.length > 0) {
            errorfields = errorfields.join(", ");
            let functionsObj: any = new Functions();
            res.send(functionsObj.output(0, `Please provide, ${errorfields}`,null));
            return false;
        } else {
            return true;
        }
    }

    /**
     * Validate array values
     * @param array array of key value pair
     * @param required_values string array of required values
     * @param res res object
     */
    validateArrayValues(required_values: any[], array: any[], res: any) {
        let errorfields: any[] = [];
        for (let i = 0; i < array.length; i++) {
            for (let k = 0; k < required_values.length; k++) {
                if (!array[i].hasOwnProperty(required_values[k])) {
                    errorfields.push(required_values[k]);
                }
            }
        }

        if (errorfields.length == 0) return true;

        let errorfields_string: string = errorfields.join(", ");
        let functionsObj: any = new Functions();
        res.send(functionsObj.output(0, `Please provide all , ${errorfields_string}`,null));
        return false;
    }

    /**
     * Validate requet object with schema validation
     * @param req req object
     * @param res res object
     * @param next next object to move on next function
     * @param schema schema validation e.g:-
     * const schema = Joi.object({
            doctor_name: Joi.string().trim().replace(/'/g, "").required()
        });
        Ref.: https://joi.dev/api/?v=17.3.0
     */
    validateRequest(req: any, res: any, next: any, schema: ObjectSchema) {
        const options = {
            abortEarly: false, // Include all errors
            allowUnknown: true, // Ignore unknown props
            stripUnknown: true, // Remove unknown props
        };

        const { error, value } = schema.validate(req.body, options);

        if (error) {

            let functionsObj = new Functions();
            res.send(functionsObj.output(0, error.message,error));
            return false;
        } else {
            req.body = value;
            next();
        }
    }


    /**
     * Check whether mobile is valid or not
     * @param mobile mobile - string
     */
    isMobileValid(mobile: string) {
        if (mobile.trim().length !== 10) return false;
        return true;
    }
}

//export default new validations();

