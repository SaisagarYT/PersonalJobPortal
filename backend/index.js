import express from 'express';
import dotenv from 'dotenv';
import supabase from './config/supabase.js';
import client from './config/infisical.js';
import oppertunityRoute from './routes/oppertunity.route.js';
dotenv.config();


const app = express();
app.use(express.json());

app.get('/supabase',async(req,res) =>{
    try{
        const {data,error} = 
        await supabase
        .from('sample')
        .select();
        if(error){
            return res.status(400).json({
                message:error.message
            });
        }
        return res.status(200).json(data);
    }
    catch(err){
        return res.status(500).json({message:err.message})
    }
})

app.get('/',async(req,res) =>{
    return res.status(200).json({
        message:"Backend is live"
    });
})

app.use('/api/v1',oppertunityRoute);

const port = process.env.PORT;
app.listen(port,() =>{
    console.log(`Port listening to ${port}`);
})