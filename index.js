const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

//middle wares
app.use(cors());
app.use(express.json());


async function run(){
    try{

    }
    finally{

    }
}
run().catch(err =>console.error(err))

app.get('/', (req,res)=>{
    res.send('GitFair server is up and running');
})

app.listen(port, ()=>{
    console.log(`server is ruuning at port ${port}`)
})