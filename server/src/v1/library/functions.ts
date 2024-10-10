import {DoctorWithSlots,SlotEntry} from "../controller/doctorController";



export class Functions {
    
    protected language: string = '';

    constructor() {
        /* Get Language Data */
        this.language = 'english';
    }


 /** To be used when have to push Date to db:
 * Formats a Date object to a string in the format YYYY-MM-DD.
 * @param date - The Date object to format.
 * @returns The formatted date string.
 */
formatDateForPostgres(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


 /** To be used when have to display date in ui local timezone followed:
 * Formats a Date object to a string in the format YYYY-MM-DD.
 * @param date - The Date object to format.
 * @returns The formatted date string.
 */
formatDateToLocalString(date: Date): string {
    // Use toLocaleDateString to format the date as 'YYYY-MM-DD'
    return date.toLocaleDateString('en-CA'); // 'en-CA' gives 'YYYY-MM-DD'
}



/**
 * Formats a Date object to a  time string in the format HH:MM:SS
 * @param date - The Date object to format.
 * @returns The formatted time string.
 */
formatTimeForPostgres(dateobj: Date): string {
        
    // Get hours, minutes, and seconds
    const hours = String(dateobj.getUTCHours()).padStart(2, '0'); // Use UTC hours
    const minutes = String(dateobj.getUTCMinutes()).padStart(2, '0'); // Use UTC minutes
    const seconds = String(dateobj.getUTCSeconds()).padStart(2, '0'); // Use UTC seconds

    // Return in HH:MM:SS format
    return `${hours}:${minutes}:${seconds}`;
}



/**
* Function to convert day into coming/today date: 
* @param {string} day - The day of the week for which to find the next date (e.g., "Monday").
* @returns {Date} The next date corresponding to the specified day.
* @returns slot_date:date 
*/
    getSlotDate(day:string): Date {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Get today's date
        const today = new Date();
        const todayDayIndex = today.getDay(); // index of today: 0: Sunday, 1: Monday, ..., 6: Saturday
        
        // Get the target day index
        const targetDayIndex = daysOfWeek.indexOf(day);
        
        // Calculate the difference in days
        let daysUntilNext = targetDayIndex - todayDayIndex;
        
        let slot_date:any;

        if (daysUntilNext === 0) {
            // If today is the target day, set slot_date to today
            slot_date = today;
        } else if (daysUntilNext < 0) {
            // If the target day has already passed this week, add 7 to get to the next week
            daysUntilNext += 7;
        }
        
        // Calculate the next date based on daysUntilNext
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntilNext);
        
        // Set slot_date to nextDate if it hasn't been set to today
        if (!slot_date) {
            slot_date = nextDate;
        }
        
        return slot_date;
}




/**
 * Function to generate time slots within a specified time frame.
 * @param startTime - The start time in "HH:mm" format (e.g., "09:00").
 * @param endTime - The end time in "HH:mm" format (e.g., "17:00").
 * @param duration - The duration of each slot in minutes.
 * @returns An array of time slot strings in "HH:mm" format.
 * @throws Error if the start time is not earlier than the end time.
 */
generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
    const slots: string[] = [];

    // Parse start and end times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    // Convert start and end times to minutes
    const startInMinutes = startHours * 60 + startMinutes;
    const endInMinutes = endHours * 60 + endMinutes;

    // Validate time range
    if (startInMinutes >= endInMinutes) {
        throw new Error('Start time must be earlier than end time.');
    }

    // Generate slots
    for (let currentTime = startInMinutes; currentTime <= endInMinutes; currentTime += duration) {
        const hours = Math.floor(currentTime / 60);
        const minutes = currentTime % 60;

        // Format time as "HH:mm"
        const slotTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        slots.push(slotTime);
    }

    return slots;
  }






 /**
 * Formats the raw doctor and slot data into a structured response.
 * @param rawDoctors The raw doctor data fetched from the model.
 * @returns An array of formatted doctor slot information, excluding passwords.
 */
    formatDoctorSlots(rawDoctors: any[]): DoctorWithSlots[] {
    const doctorsWithSlots: { [key: number]: DoctorWithSlots } = {};

    rawDoctors.forEach(doctor => {
        // Get the current local date in 'YYYY-MM-DD' format
        const now = new Date();
        const localDateString = now.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

        const slotEntry: SlotEntry = {
            date: localDateString,
            day: doctor.day,
            startFrom: doctor.start_time,
            // Calculate endTime based on local start time
            endTime: new Date(`1970-01-01T${doctor.start_time}`).getTime() + (doctor.consultation_duration * 60000),
            fee: doctor.fee,
        };

        if (!doctorsWithSlots[doctor.doctor_id]) {
            doctorsWithSlots[doctor.doctor_id] = {
                doctor_id: doctor.doctor_id,
                name: doctor.name,
                specialty: doctor.specialty,
                covered_diseases: doctor.covered_diseases,
                clinic: {
                    clinic_id: doctor.clinic_id,
                    name: doctor.clinic_name,
                    address: doctor.clinic_address
                },
                slots: []
            };
        }

        // Push the slotEntry to the respective doctor's slots
        doctorsWithSlots[doctor.doctor_id].slots.push(slotEntry);
    });

    return Object.values(doctorsWithSlots); // Convert to array for the response
    }






/**
 * Send output to client with status code and message
 * @param status_code status code of a response
 * @param status_message status message of a response
 * @param data response data
 * @returns object with 3 parameters
 */
    output(status_code: number, status_message: any, data: any = null) {
        //if (this.languagevars[status_message]) status_message = this.languagevars[status_message];

        let output = {
            status_code: status_code.toString(),
            status_message: status_message,
            //datetime: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            data: data
        };

        /* if (data.length > 0 || Object.keys(data).length) {
            output.data = data;
        } else {
            delete output.data;
        } */

        return output;
    }
}
