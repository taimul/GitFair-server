const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, email, ObjectId } = require("mongodb");
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
//ssl commerz ---
const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASSWORD
const is_live = false //true for live, false for sandbox


async function run() {
  try {
    const mediaCollection = client.db("Gitfair").collection("files");
    const usersCollection = client.db("Gitfair").collection("users");
    const indivUsersCollection = client.db("Gitfair").collection("indivUsers");
    const commentCollection = client.db("Gitfair").collection("comment");
    const likesCollection = client.db("Gitfair").collection("likes");
    const uploadCollections = client.db('Gitfair').collection('uploadCollections')

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

    app.get('/uploaded/:id', async (req, res) => {
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

    // post users info
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await indivUsersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    // get users info
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    //  find single user
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.find(filter).toArray();
      res.send(result);
    });
    //  find single user email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await usersCollection.find(filter);
      res.send(result);
    });


    // delete user

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
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

    // AFTER payment successuser store on DATABASE ---
    app.post("/premiumuser", async (req, res) => {
      const payConfirmUserDb = req.body;
      // console.log(payConfirmUserDb);
      const result = await indivUsersCollection.updateOne(
        { email: payConfirmUserDb?.email },
        {
          $set: {
            ...payConfirmUserDb
          }

        }
      );
      if (result.modifiedCount) {
        res.status(200).send({
          success: true,
          message: `Successfully Update ${payConfirmUserDb.email}`,
          data: result,
        });
      } else {
        const result2 = await indivUsersCollection.insertOne(payConfirmUserDb);
        res.status(200).send({
          success: true,
          message: `Successfully create Premium user ${payConfirmUserDb.email}`,
          data: result2,
        });
      }
    });


    // get API to load the specific premium user data
    app.get('/profile/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await indivUsersCollection.findOne(query);
      res.send(user);
    });


    // (check user is premium or not premium / normal user)  || get premium user from database---
    app.post("/premiumuserfromdb", async (req, res) => {
      const { email } = req.body;
      // console.log("where is email", email) //
      const query = {
        email,
      };

      // console.log(payConfirmUserDb);
      const result = await indivUsersCollection.findOne(query);
      // console.log(result);
      if (result?.premiumUser) {
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



    // bkash paymetn start --
    app.post("/pay-sslcommerz", async (req, res) => {
      const payConfirmUserDb = req.body;
      if (!payConfirmUserDb) {
        return res.status(500).send({
          success: false,
          message: "Bad Auth, body message not found"
        })
      }
      const transactionId = new ObjectId().toString();
      const data = {
        total_amount: payConfirmUserDb.price,
        currency: 'BDT',
        tran_id: transactionId, // use unique tran_id for each api call

        success_url: `${process.env.SERVER_URL}/success?transactionId=${transactionId}`,
        fail_url: `${process.env.SERVER_URL}/failed?transactionId=${transactionId}`,
        cancel_url: `${process.env.SERVER_URL}/failed?transactionId=${transactionId}`,
        ipn_url: `${process.env.SERVER_URL}/ipn`,

        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: payConfirmUserDb.name,
        cus_email: payConfirmUserDb.email,
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
      sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({
          success: true,
          url: GatewayPageURL,
        })
        // console.log('Redirecting to: ', GatewayPageURL)
      });

      // await 
      const fakeData = {
        name: payConfirmUserDb.name,
        email: payConfirmUserDb.email,
        price: payConfirmUserDb.price / 107,
        userPremiumDuration: payConfirmUserDb.userPremiumDuration,
        transactionId,
      }
      const result = await indivUsersCollection.updateOne(
        { email: payConfirmUserDb.email },
        {
          $set: {
            ...fakeData
          }
        }
      );
      if (!result.modifiedCount) {
        await indivUsersCollection.insertOne(fakeData);
      }
    })

    app.post("/success", async (req, res) => {
      const { transactionId } = req.query;
      if (!transactionId) {
        return res.redirect(`${process.env.CLIENT_URL}/failed`)
      } else {
        const result = await indivUsersCollection.updateOne(
          { transactionId },
          {
            $set: {
              premiumUser: true, paymentDate: new Date(),
            }
          }
        )
        if (result.modifiedCount) {
          res.redirect(`${process.env.CLIENT_URL}/dashboard/premiumfeature`)
        }
      }
    })
    app.post("/failed", async (req, res) => {
      return res.redirect(`${process.env.CLIENT_URL}/failed`)
    });
    app.get("/order/by-transaction-id/:id", async (req, res) => {
      const { id } = req.params;
      const order = await indivUsersCollection.findOne({ transactionId: id });
      res.status(200).send({ success: true, data: order });
    })
    // bkash payment end ---








    // post users info 
    app.post('/users', async (req, res) => {
      const user = req.body
      const result = await indivUsersCollection.insertOne(user)
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
      const result = await indivUsersCollection.find(query).toArray()
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
  console.log(`server is running at port ${port}`);
});

// this is comment 