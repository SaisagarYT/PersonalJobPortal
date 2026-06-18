import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.get('/',async(req,res) =>{
    return res.status(200).json({
        message:"Backend is live.."
    });
})
const port = process.env.PORT;
app.listen(port,() =>{
    console.log(`Port listening to ${port}`);
})