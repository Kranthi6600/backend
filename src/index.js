import dotenv from 'dotenv'
import connectDB from './db/index.js';
dotenv.config({ path: '/custom/path/to/.env' })

connectDB()
.then(()=> {
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log('mongodb connnection failed !!!', err)
})