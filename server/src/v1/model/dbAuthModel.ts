import bcrypt from 'bcryptjs';
import { Appdb } from '../model/appdb';


export interface User {
  id?: number; 
  name?: string;
  mobile:string;
  address?:string;
  email?: string;
  password?: string; 
  dob?: Date;
  gender?:string;
  role?:string;
  qualifications?:string;
  experience?:number;
}

class UserModel extends Appdb {

  constructor() {
    super();
    this.table = ''; 
    this.uniqueField = ''; 
  }


    /**
   * Creates a new user in the database.
   * @param user The user data to create.
   * @returns The created user or an error response.
   */
  async createUser(user: User): Promise<any | null> {
    const hashedPassword = await bcrypt.hash(user.password!, 10);
    this.table = user.role === 'doctor' ? 'doctor' : 'patient';
    const data = {
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      password: hashedPassword,
    };
    const result = await this.insert(this.table, data);
    return result>0?result:null; // Returns the ID of the newly created user
  }


  /**
   * Finds a user by mobile number.
   * @param user The user to find.
   * @returns The found user or null.
   */
  async findUserByMobile(user: User): Promise<User | null> {
    this.table = user.role === 'admin' ? 'admin' : user.role === 'doctor' ? 'doctor' : 'patient';
    const result = await this.select(this.table, '*', `WHERE mobile = '${user.mobile}'`, '', '');
    return result.length > 0 ? result[0] : null;
  }


  /**
   * Updates a user's(patient or doctor) information.
   * @param tableName The name of the table to update.
   * @param id The ID of the user to update.
   * @param updates The updates to apply.
   * @returns A response indicating success or failure.
   */
  async updateUserProfile(tableName: string, id: number, updates: Partial<User|any>): Promise<{ success: boolean; message: string }> {
     this.table = tableName, 
     this.uniqueField=`${tableName === 'doctor' ? 'doctor_id' : 'patient_id'}`;
     const result = await this.updateRecord(id,updates);
     return result>0?result:null;
  }


/**
   * Deletes a user by their ID.
   * @param id The ID of the user to delete.
   * @param role The role of the user.
   * @returns A response indicating success or failure.
   */
  async deleteUser(id: number, role: string): Promise<{ success: boolean; message: string }> {
    this.table = role === 'doctor' ? 'doctor' : 'patient';
    const result = await this.delete(this.table, `WHERE ${role}_id = ${id}`);

    if (result) {
      return { success: true, message: 'User deleted successfully' };
    }
    return { success: false, message: 'Failed to delete user' };
  }
}
  

export default new UserModel();
