const express = require("express");
const app = express();
const cors = require('cors')
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(express.json());
app.use(cors());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.Mongo_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // Collections

    const userCollections = client.db("MetaMansion").collection("users");
    const roomsCollections = client.db("MetaMansion").collection("rooms");
    const bookingCollections = client.db("MetaMansion").collection("booking");

    // Add newly registered users to the database
    app.post("/api/createUser", async (req, res) => {
      const userData = req.body;
      const userEmail = userData.email;
      const query = { email: userEmail };
      const isExist = await userCollections.findOne(query);
      if(isExist){
        return res.send({ message: "User already exists" });
      }
      const result = await userCollections.insertOne(userData);
      res.send(result);
    });

    // Get the available Rooms
    app.get('/api/getRooms', async (req, res) => {
      // let query = {};

      // Check if the client provided a sorting parameter
      //   If sorting parameter is provided, use it
      //   const sortOrder = req.query?.sortOrder === 'desc' ? -1 : 1;
      //   query = { $query: {}, $orderby: { ["price"]: sortOrder } };
      //   .sort({ price: sortOrder })
      const result = await roomsCollections.find().toArray();
      res.send(result);
    })

    // Get a specific room details For Room Details Page
    app.get('/api/getRoomDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollections.findOne(query);
      res.send(result);
    })

    // Book room Based on the User
    app.post("/api/bookRoom", async (req, res) => {
      const bookingData = req.body;
      const roomId = bookingData.roomId
      const query = { roomId: roomId };
      const isExist = await roomsCollections.findOne(query);
      if(isExist) {
        return res.send({ message: "Room already booked" });
      }
      const result = await bookingCollections.insertOne(bookingData);
      res.send(result);
      })

      // make a room unavailabe after successful booking
      app.patch('/api/makeUnavailable/:id',async(req,res)=>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            availability: "unavailable"
          }
        }
        const result = await roomsCollections.updateOne(query, updateDoc);
        res.send(result);
      })
      // Get all the booked rooms for user with user email
      

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("MetaMention is Running!");
});

app.listen(port, () => {
  console.log(`MetaMention app listening on port ${port}`);
});
