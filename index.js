const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    // const indivUsersCollection = client.db("Gitfair").collection("users");
    const indivindivUsersCollection = client.db("Gitfair").collection("indivUsers");
    const commentCollection = client.db("Gitfair").collection("comment");
    const likesCollection = client.db("Gitfair").collection("likes");
    const uploadCollections = client.db("Gitfair").collection("uploadCollections")

    // inputed from jamsheds server 
    app.post('/upload', async (req, res) => {
      const upload = req.body
      const result = await uploadCollections.insertOne(upload)
      res.send(result)
    })

    // get blogs
    app.get('/upload/:email', async (req, res) => {
      const query = req.params.email
      const filter = { email: query }
      const result = await uploadCollections.find(filter).toArray()
      res.send(result)
    })
    app.get('/upload', async (req, res) => {
      const query = {}
      const result = await uploadCollections.find(query).sort({ _id: -1 }).toArray()
      res.send(result)
    })

    app.get('/uploadedData/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const result = await uploadCollections.findOne(filter)
      res.send(result)
    })

    app.delete('/uploaded/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const result = await uploadCollections.deleteOne(filter)
      res.send(result)
    })

    app.post("/files", async (req, res) => {
      const images = req.body;
      const result = await mediaCollection.insertOne(images[0]);
      res.send(result);
    });

    //get  all the files
    app.get("/all-files", async (req, res) => {
      const query = {};
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
      const result = await indivUsersCollection.insertOne(payConfirmUserDb);
      res.status(200).send({
        success: true,
        message: `Successfully create the user ${payConfirmUserDb.email}`,
        data: result,
      });
    });

    // (chect user is premium or not premium / normal user)  || get premium user from database---
    app.post("/premiumuserfromdb", async (req, res) => {
      const { email } = req.body;
      // console.log("where is email", email) //
      const query = {
        email,
      };
      // console.log(payConfirmUserDb);
      const result = await indivUsersCollection.findOne(query);
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

    // post users info 
    app.post('/users', async (req, res) => {
      const user = req.body
      const result = await indivindivUsersCollection.insertOne(user)
      res.send(result)
    });

    // post a like
    app.post('/like', async (req, res) => {
      const like = req.body
      const result = await likesCollection.insertOne(like)
      res.send(result)
    });

    // post a comment 
    app.post('/comment', async (req, res) => {
      const comment = req.body
      const result = await commentCollection.insertOne(comment)
      res.send(result)
    });

    // get users info 
    app.get('/users', async (req, res) => {
      const query = {}
      const result = await indivindivUsersCollection.find(query).toArray()
      res.send(result)
    })
    // get likes
    app.get('/likes/:id', async (req, res) => {
      const id = req.params.id
      const filter = { id: id }
      const result = await likesCollection.find(filter).sort({ '_id': -1 }).toArray()
      res.send(result)
    })

    // get comments 
    app.get('/comment', async (req, res) => {
      const query = {}
      const result = await commentCollection.find(query).toArray()
      res.send(result)
    })
    // get comment by id 
    app.get('/comment/:id', async (req, res) => {
      const id = req.params.id
      const filter = { id: id }
      const result = await commentCollection.find(filter).sort({ '_id': -1 }).toArray()
      res.send(result)
    })

    // delete a like 
    app.delete('/likes/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email }
      const result = await likesCollection.deleteOne(filter)
      res.send(result)
    })

    // delete a comment 
    app.delete('/comments/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const result = await commentCollection.deleteOne(filter)
      res.send(result)
    })
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
  console.log(`server is ruuning at port ${port}`);
});
