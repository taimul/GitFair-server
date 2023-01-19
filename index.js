const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
require("colors");


// mongoDB initialized ---
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middle wares
app.use(cors());
app.use(express.json());



// chat-gpt open AI initialized---
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.CHATGPT_OPENAI_API_KEY,
})










async function run() {










    try {


        //sofia start-----------


        //sofia end------------




















    }
    catch (error) {

    }
    finally {

    }

}

run().catch(err => console.error(`this error is from catch section ${err}`.bgRed))

















app.get('/', (req, res) => {
    res.send('GitFair server is up and running');
})

app.listen(port, () => {
    console.log(`server is ruuning at port ${port}`.bgCyan)
})