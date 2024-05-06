const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// MiddleWare
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zebesho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    const database = client.db("Car-Doctor");
    const services = database.collection("services");

    app.get("/services", async (req, res) => {
      const cursor = services.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
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
