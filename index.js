const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// MiddleWare
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zebesho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// MiddleWare
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized!" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log("The Error is:", err);
      return res.status(401).send({ message: "Unauthorized!" });
    }
    console.log("Value of the token: ", decoded);
    req.decoded = decoded;
  });
  next();
};

async function run() {
  try {
    // await client.connect();

    const database = client.db("Car-Doctor");
    const services = database.collection("services");
    const bookings = database.collection("bookings");

    // Auth Related Api

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("User value is: ", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5s",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("Logout Success: ", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // Service related Api
    app.get("/services", async (req, res) => {
      const cursor = services.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, img: 1, price: 1 },
      };
      const result = await services.findOne(query, options);
      res.send(result);
    });

    app.get("/bookings", verifyToken, async (req, res) => {
      // console.log("my token", req.cookies.token);
      // console.log("valid User:", req.decoded);
      console.log("This is Routes");
      if (req.query?.email !== req.decoded?.email) {
        return res.status(403).send({ message: "Forbidden Access!" });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const cursor = bookings.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookings.insertOne(booking);
      res.send(result);
    });

    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await bookings.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookings.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("Database connection success!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("App is Running!");
});

app.listen(port, () => console.log("App is Running!"));
