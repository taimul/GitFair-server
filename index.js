const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, email } = require("mongodb");
require("dotenv").config();
// chat-gpt open AI initialized---
const { Configuration, OpenAIApi } = require("openai");
const app = express();
const port = process.env.PORT || 5000;

//middle wares
app.use(cors());
app.use(express.json());

//MongoDB coneection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wzbzlyu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// STRIPE ---
const stripe = require("stripe")(process.env.STRIPT_SECRET);

async function run() {
  try {
    const mediaCollection = client.db("Gitfair").collection("files");
    const usersCollection = client.db("Gitfair").collection("users");
    const indivUsersCollection = client.db("Gitfair").collection("indivUsers");

    // post users info
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await indivUsersCollection.insertOne(user);
      res.send(result);
    });

    // get users info
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await indivUsersCollection.find(query).toArray();
      res.send(result);
    });

    //post files on DB
    app.post("/files", async (req, res) => {
      const images = req.body;
      const result = await mediaCollection.insertOne(images);
      res.send(result);
    });

    //get  all the files by user email
    app.get("/all-files/:email", async (req, res) => {
      const emails = req.params.email;
      const query = { email: emails }
      const cursor = mediaCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // stripe payments ---
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const priceAmount = price * 100;
      // console.log({ priceAmount })
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: priceAmount,
        payment_method_types: ["card"],
      });
      res.status(200).send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payment successuser store on DATABASE ---
    app.post("/premiumuser", async (req, res) => {
      const payConfirmUserDb = req.body;
      // console.log(payConfirmUserDb);
      const result = await usersCollection.insertOne(payConfirmUserDb);
      res.status(200).send({
        success: true,
        message: `Successfully create the user ${payConfirmUserDb.email}`,
        data: result,
      });
    });


    // get API to load premium users data
    app.get('/premiumuser', async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    })

    // get API to load the specific premium user data
    app.get('/profile/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    })


    // (chect user is premium or not premium / normal user)  || get premium user from database---
    app.post("/premiumuserfromdb", async (req, res) => {
      const { email } = req.body;
      // console.log("where is email", email) //
      const query = {
        email,
      };

      // console.log(payConfirmUserDb);
      const result = await usersCollection.findOne(query);
      if (result) {
        res.status(200).send({
          success: true,
          message: `Successfully create the user ${email}`,
          data: result,
        });
      } else {
        res.status(200).send({
          success: false,
          message: `This user is not a premium member`,
        });
      }
    });

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
      });
      // console.log({ ans: response.data.choices[0].text });
      res.status(200).send({
        bot: response.data.choices[0].text,
      });
    });
    //sofia end-----------
  } finally {
  }
}
run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("fileUpload, ChatGPT and Stripe server is up and running");
});

app.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
