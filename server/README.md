# Doctor Appointment Booking System (Backend)

## Postman Published URL

[Postman Documentation](https://documenter.getpostman.com/view/32177390/2sAXxMfsxh)

## Git Repository URL

[GitHub Repository](https://github.com/Atul9180/Doctor_appointment_NodeJS_Postgresql_Angular/tree/main/server)

## Overview

This project is a Doctor Appointment Booking System API built using TypeScript, Express, Joi, and PostgreSQL. It provides functionalities for managing patients, doctors, appointment. The API follows RESTful principles, adhering to Object-Oriented Programming (OOP) and TypeScript conventions.

## Table of Contents

- [Project Structure](#project-structure)
- [Usage](#usage)
- [Database Schema](#database-schema)
- [Additional Considerations](#additional-considerations)

## Project Structure

```bash
server/
├── src/
│   ├── v1/
│   │   ├── controller/
│   │   │   ├── doctorController.ts
│   │   │   ├── etc.
|   |   |
│   │   ├── library/
│   │   │   ├── connection.ts
│   │   │   ├── etc.
|   |   |
│   │   ├── model/
│   │   │   ├── dbDoctorModel.ts
│   │   │   ├── etc.
|   |   |
│   │   ├── config.ts
│   │   ├── constants.ts
│   │   └── index.ts
|   |
│   └── app.ts
├── package-lock.json
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## Usage

To get started with the Doctor Appointment Booking System API, follow these steps:

### Step 1: Clone the repository to your local machine:

```bash
git clone https://github.com/Atul9180/Doctor_appointment_NodeJS_Postgresql_Angular.git
cd Doctor_appointment_NodeJS_Postgresql_Angular/server
```

### Step 2: Install the required dependencies using npm:

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a .env file in the root of the project and configure your database and other environment variables. Here’s a sample of what to include:

```bash
DATABASE_URL = postgresql://username:password@localhost:5432/mydatabase
JWT_SECRET=your_jwt_secret
PORT= portNumber
```

### Step 4: Run the Dev Server:

```bash
npm run start:dev
```

### Step 5: To Build ts:

```
npm run build
```

### Step 7: To run on server:

```
npm run start
```

## Database Schema:

### ER Diagram (using erasor.io):

```bash
admin [icon: user, color: red]
{
admin_id int pk
name string
mobile int UNIQUE
email string
password string
address string
gender string
}

clinic [icon:folder,color:yellow]{
clinic_id int pk
name string
address string
contact_number int
}

speciality [icon:doctor,color:green]{
specialty_id int pk
speciality string
diseases_covered string
}

doctor [icon: doctor, color: yellow] {
doctor_id int pk
name string
mobile int UNIQUE
email string
password string
registration_number string
address string
gender string
qualifications string
specialty_id string FK
total_consultations int DEFAULT 0
}

doctor.specialty_id > speciality.specialty_id


doctor_schedule [icon: file-contract, color: blue] {
id int PK
doctor_id int FK
clinic_id int
slot_time time
end_time time
consultation_duration int
day string
fee int
}

slots_availability [icon: file-contract, color: orange] {
id int PK
schedule_id int
doctor_id int FK
clinic_id int
slot_time time
slot_duration int
slot_date date
fee int
status string enum "available or booked or cancelled"
}

booked_appointment_slots [icon: file-signature, color: red] {
id int pk
doctor_id int FK
patient_id int FK
slot_id int FK
appointment_date date
appointment_time time
fee int
status string
updated_at timestamp
}

Payment [icon: payment, color: green] {
id int pk
appointment_id int FK
amount int
payment_status string
updated_at timestamp
}

patient [icon: user, color: blue] {
patient_id int pk
name string
mobile int UNIQUE
email string
password string
address string
gender string
medical_history string
age int
}
```
## ER-Diagram (using DBeaver):
![ER](https://github.com/user-attachments/assets/ae819e09-91a8-42e0-a587-fdd5344c0396)


## Data Flow Diagram (using draw.io):
![DFD](https://github.com/user-attachments/assets/f55bde2f-319e-4965-ae26-8f35976d054e)


## Additional Considerations

### CORS:

Set up in the middleware and included in the main app configuration.

### Dotenv:

Used this package to load environment variables from the .env file.

### Hot Reloading:

Hot Reloading: Configure nodemon to watch for changes in your TypeScript files and restart the server automatically. This can be done with the following command(i have used it in script(start:dev)):

```bash
npx nodemon --exec ts-node src/app.ts
```
