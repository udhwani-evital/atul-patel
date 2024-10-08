import express from 'express';
import cors from "cors"
import dotenv from "dotenv";


import SlotsModel from "./v1/model/dbSlotsModel";


/**
 * env variables Configuration
 */
dotenv.config();

/*
 *  Create express server instance.
 */
const app = express();


/*
 * Express Middleware configuration 
 */
app.use(express.json({ limit: '5mb' })); //parse incoming max size payload accept by server  JSON requests and makes the data available in req.body
app.use(express.urlencoded({ extended: false })); //parse URL-encoded data(forms data) & avail in req.body. extended: false option means parse incoming data with the querystring library not nested ones(will treat whole nested as another urlencoded eg: 'address[house]=12&address[location] ).
app.use(cors());


SlotsModel.scheduleTask();



const Port:any = process.env.PORT || 3000;
var server = app.listen(Port, () => {
  console.log(`Server is running on http://localhost:${Port}`);
});


/*
 * Primary app routes.
 */
app.use('/v1', require('./v1'));

module.exports = server; // server instance can be used in testing 

