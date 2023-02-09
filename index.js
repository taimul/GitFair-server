const express = require('express');
const cors = require('cors');
const http = require('http');
require("dotenv").config();
require("colors");
const port = process.env.PORT || 5000;
const ACTIONS = require('./Actions');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


//middle wares
app.use(cors());
app.use(express.json());



// mongoDB initialized ---
// const uri = "mongodb+srv://git-fair-sofi-5:wGIkgVOp2DOT4e2R@cluster0.wzbzlyu.mongodb.net/?retryWrites=true&w=majority";

const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zwgt8km.mongodb.net/?retryWrites=true&w=majority`;
const uri = "mongodb+srv://git-fair-sofi-5:wGIkgVOp2DOT4e2R@cluster0.zwgt8km.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// STRIPE --- 
const stripe = require("stripe")(process.env.STRIPT_SECRET);



//sofia start-----------

// socket function start ---- 
const userSocketMap = {}; // socketId : usrName (storing users data)
function getAllConnectedClients(roomId) {

    // server from whos room id is geeted --- 
    // io.sockets.adapter.rooms.get(roomId) = map (returns a map )
    // console.log(Array.from('foo'));
    // Expected output: Array ["f", "o", "o"]
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            userName: userSocketMap[socketId],
        }
    });
}

// //  socket.io function --- 

io.on("connection", (socket) => {
    // console.log("connection success of socket.io", socket.id);

    // when user/client join this junction will be trigger from the front end ---
    socket.on(ACTIONS.JOIN, ({ roomId, userName }) => {


        // store userName on this -- 
        userSocketMap[socket.id] = userName;
        // client join  under the line of function ---

        // room id generated and same name(roomId) room is created on frontEnd ---
        socket.join(roomId);

        // connected clients lish --- 
        const clients = getAllConnectedClients(roomId);
        // console.log(clients)


        // clients joined functions ---------
        clients.forEach(({ socketId }) => {
            // NOTIFY client if someone joined -- 
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                userName,
                socketId: socket.id,
            })
        });


        // get code from code edtiro from the clients side ------ 
        socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
            // send code to all include me (who type )
            // console.log({ roomId, code });
            // io.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
            // send codeWwho type this --- 
            socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
        })

        // get code SYNC ------ 
        socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
            io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
        })


        //         // DISCONNECT OR SERVER CLOSED --- 
        socket.on("disconnecting", () => {
            // [... socket.rooms] = Array.from(socket.rooms)= ame work -- 
            const rooms = [...socket.rooms];
            rooms.forEach((roomId) => {
                socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                    userName,
                    socketId: socket.id,
                })
            });
            // delete user from userLIST---
            delete userSocketMap[socket.id]
            // leave ROOM OFFICIALLY methods-- -
            socket.leave();
        })
    })
})

// ----------------- socket function stop


// sofi start  -------

async function run() {

    try {



        // MONGODB COLLECTIONS ---- 
        const database = client.db("gitfair-server");
        const usersCollection = database.collection("users");

        // MongoDB DataBase connected --- 

        // stripe payments --- 
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const priceAmount = price * 100;
            // console.log({ priceAmount })
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: priceAmount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.status(200).send({
                clientSecret: paymentIntent.client_secret,
            })
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
            })
        });

        // (chect user is premium or not premium / normal user)  || get premium user from database--- 
        app.post("/premiumuserfromdb", async (req, res) => {
            const { email } = req.body;
            // console.log("where is email", email) //
            const query = {
                email,
            }
            // console.log(payConfirmUserDb);
            const result = await usersCollection.findOne(query);
            if (result) {
                res.status(200).send({
                    success: true,
                    message: `Successfully create the user ${email}`,
                    data: result,
                })
            } else {
                res.status(200).send({
                    success: false,
                    message: `This user is not a premium member`,
                })
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
            })
            // console.log({ ans: response.data.choices[0].text });
            res.status(200).send({
                bot: response.data.choices[0].text
            });
        })
        //sofia end-----------

    }
    catch (error) {
    }
    finally {
    }
}
run().catch(err => console.error(`this error is from catch section ${err}`.bgRed))
// sofi end -------



app.get('/', (req, res) => {
    res.send({
        success: true,
        data: 'Hello World!',
    });
});



server.listen(port, () => {
    console.log(`Server started on port: ${port}`.bgCyan);
});
