import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`/n mongodb connected !! Db Host: ${mongoose.connection.host}`)
    } catch (error) {
        console.error('MongoDB Error: ', error)
        process.exit(1)
    }
}

export default connectDB
