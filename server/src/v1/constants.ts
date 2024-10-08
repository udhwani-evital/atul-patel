import Joi from "joi";

export const constants = {
    /***********************************
     *	Static Urls & Variables
    ************************************/
    joiStringRequired : Joi.string().trim().required(),
    joiStringOptional: Joi.string().trim(),
    PRODUCT_NAME: 'Core Framework',
};
