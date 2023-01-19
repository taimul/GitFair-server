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








async function run() {










    try {


        //sofia start-----------


        // CHATGPT_OPENAI function --- 
        app.post("/searchai", async (req, res) => {
            const prompt = req.body.prompt;

            // console.log({ prompt })
            // text-davinchi-003 --- ( open ai api- )
            const configuration = new Configuration({
                apiKey: process.env.CHATGPT_OPENAI_API_KEY,
            });
            const openAI = new OpenAIApi(configuration);
            const response = await openAI.createCompletion({
                model: "text-davinci-003",
                prompt: `${prompt}`,
                temperature: 0,
                max_tokens: 3000,
                top_p: 1,
                frequency_penalty: 0.5,
                presence_penalty: 0,
            })
            // console.log({ ans: response.data.choices[0].text });

            res.status(200).send({
                bot: response.data.choices[0].text
            });
        })

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