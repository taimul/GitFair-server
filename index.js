const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
require("colors");




//middle wares
app.use(cors());
app.use(express.json());






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