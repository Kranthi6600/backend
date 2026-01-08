import dotenv from 'dotenv'
import connectDB from './db/index.js';
dotenv.config({ path: '/custom/path/to/.env' })

connectDB();