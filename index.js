const cors = require("cors");
const jwt = require("jsonwebtoken");
const express = require("express");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle were
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cars-project-58.web.app",
      "https://cars-project-58.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Cars Doctor is Running now");
});

/// custom middle were
// and token verify custom

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("middle were token", token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Unauthorized Access " });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.ykv18.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
//devloy

const cokeOption = {
  httpOnly: true,
  sameSite: process.env.MODE_ENV === "production" ? "none" : "strict",
  secure: process.env.MODE_ENV === "production" ? true : false, // https hole true ha be
};
async function run() {
  try {
    // await client.connect();

    const serviceCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("bookings");

    //  jwt token created auth relet
    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.cookie("token", token, cokeOption).send({ success: true });
    });

    // jwt token logout to cookie remove
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logOut User", user);
      res
        .clearCookie("token", { ...cokeOption, maxAge: 0 })
        .send({ logout: true });
    });

    // services///
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // const options = {
      //   projection: { title: 1, price: 1, service_id: 1, img: 1 },
      // };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // booking start
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
      // console.log(booking);
    });

    // just token created just
    app.get("/bookings", verifyToken, async (req, res) => {
      //verifyToken
      // console.log(req.cookies);
      console.log("token user info", req.user);

      if (req.user.email !== req.user.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find().toArray();
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("Car Doctor Running Ins NOw Port On ", { port });
});
