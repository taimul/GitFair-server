const express = require('express');
const cors = require('cors');
const app = express();
require("dotenv").config();
require("colors");
const port = process.env.PORT || 5000;
const ACTIONS = require('./Actions');



// mongoDB initialized ---
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middle wares
app.use(cors());
app.use(express.json());


// ----------------- socket start
const { Server } = require("socket.io");
const http = require("http")
const server = http.createServer(app);
const io = new Server(server);


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

//  socket.io function --- 
io.on("connection", (socket) => {
    console.log("connection success of socket.io", socket.id);

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


        // DISCONNECT OR SERVER CLOSED --- 
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

// ----------------- socket stop



// chat-gpt open AI initialized---
const { Configuration, OpenAIApi } = require("openai");
const { CODE_CHANGE } = require('./Actions');









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

// app.listen(port, () => {
//     console.log(`server is ruuning at port ${port}`.bgCyan)
// })

// // socket.io server listen -------- 
// server.listen(5001, () => {
//     console.log(`socket.io server is runing on  5001`.bgWhite)
// });

server.listen(port, () => {
    console.log(`server is ruuning at port ${port}`.bgCyan)
})