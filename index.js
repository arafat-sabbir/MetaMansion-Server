const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173","https://metamention-hub.web.app"],
    credentials: true,
  })
);
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
    const reviewCollections = client.db("MetaMansion").collection("review");
    // Make A Token For Signed In User
    app.post("/api/jwt", async (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1hr",
        });
        res
          .cookie("token", token, {
            sameSite: "none",
            secure: true,
            httpOnly: true,
          })
          .send({ "token for the user": token });
      } catch (error) {
        res.status(401).send(error);
      }
    });
    // Clear the token if use signOut
    app.post("/api/signout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // Add newly registered users to the database
    app.post("/api/createUser", async (req, res) => {
      const userData = req.body;
      const userEmail = userData.email;
      const query = { email: userEmail };
      const isExist = await userCollections.findOne(query);
      if (isExist) {
        return res.send({ message: "User already exists" });
      }
      const result = await userCollections.insertOne(userData);
      res.send(result);
    });

    // Get the available Rooms
    app.get("/api/getRooms", async (req, res) => {
      // let query = {};

      // Check if the client provided a sorting parameter
      //   If sorting parameter is provided, use it
      //   const sortOrder = req.query?.sortOrder === 'desc' ? -1 : 1;
      //   query = { $query: {}, $orderby: { ["price"]: sortOrder } };
      //   .sort({ price: sortOrder })
      const result = await roomsCollections.find().toArray();
      res.send(result);
    });

    // Get a specific room details For Room Details Page
    app.get("/api/getRoomDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollections.findOne(query);
      res.send(result);
    });

    // Book room Based on the User
    app.post("/api/bookRoom", async (req, res) => {
      const bookingData = req.body;
      const roomId = bookingData.roomId;
      const query = { roomId: roomId };
      const isExist = await roomsCollections.findOne(query);
      if (isExist) {
        return res.send({ message: "Room already booked" });
      }
      const result = await bookingCollections.insertOne(bookingData);
      res.send(result);
    });

    // make a room unavailabe after successful booking
    app.patch("/api/makeUnavailable/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          availability: "unavailable",
        },
      };
      const result = await roomsCollections.updateOne(query, updateDoc);
      res.send(result);
    });
    // Get all the booked rooms for user with user email
    app.get("/api/getMyBookings", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await bookingCollections.find(query).toArray();
      res.send(result);
    });

    // Delete A Booking Room
    app.delete("/api/deleteBooking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollections.deleteOne(query);
      res.send(result);
    });

    // update A Booking Date
    app.patch("/api/updateBookingDate/:id", async (req, res) => {
      const {bookingDate} = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedData = {
        $set: {
          bookingDate: bookingDate,
        },
      };
      const result = await bookingCollections.updateOne(query, updatedData);
      res.send(result);
    });

    // Add Review
    app.post('/api/addReview',async(req,res)=>{
      const ReviewData = req.body;
      const result = await reviewCollections.insertOne(ReviewData)
      res.send(result)
    })
    // get Review For The Specific post 
    app.get('/api/getReview/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const query = {RoomId:id}
      console.log(query);
      const result = await reviewCollections.find(query).toArray()
      res.send(result)
      console.log(result);
    })

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
