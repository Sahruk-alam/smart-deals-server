require('dotenv').config() 
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;

const admin = require("firebase-admin");


// index.js
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jfbqb9o.mongodb.net/?appName=Cluster0`;

const app = express();
app.use(cors());
app.use(express.json());

const verifyAccessToken=async (req,res,next)=>{

    const authorization=req.headers.authorization;
    if(!authorization){
      return res.status(401).send({message:'Unauthorized access'})
    }
    const token=authorization.split(' ')[1];
    try{
    const decode=await admin.auth().verifyIdToken(token);
    console.log('Decoded token:', decode);
    req.decodedEmail=decode.email;
    next();
    }
    catch(error){
     return res.status(401).send({message:'Unauthorized access'})
    }

}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Smart deals Server is running");
  
});

async function run() {
  try {
    await client.connect();
    const db = client.db("smartDeals");
    const collection = db.collection("products");
    const bidsCollection = db.collection("bids");
    const userCollection = db.collection("users");

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        res.send("Do not create user with same email");
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });

    // bids api - must come BEFORE /products/:id
    app.get("/bids",verifyAccessToken, async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.buyer_email = email;
        if(email !==req.decodedEmail){
          return res.status(403).send({message:'Forbidden access'})
        }
      }
      console.log(query);
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/products/bids/:productId", async (req, res) => {
      const productId = req.params.productId;
      const query = { product: productId };
      const cursor = bidsCollection.find(query).sort({ bid_price: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/bids", async (req, res) => {
      const newBids = req.body;
      const result = await bidsCollection.insertOne(newBids);
      res.send(result);
    });

    app.delete("/bids/:id", async (req, res) => {
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result=await bidsCollection.deleteOne(query);
      res.send(result);
    })

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await collection.findOne(query);
      res.send(result);
    });
    app.get("/products", async (req, res) => {
      // const projectFields = { title: 1, price_min: 1 };
      //   const cursor=collection.find().sort({price_min:1}).skip(4)
      //   .limit(3).project(projectFields);
      console.log(req.query);

      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = collection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/products", verifyAccessToken, async (req, res) => {
      console.log('Header in the post:', req.headers);
      const newProduct = req.body;
      const result = await collection.insertOne(newProduct);
      res.send(result);
    });

    // recent products api
    app.get("/recent-products", async (req, res) => {
      const cursor = collection.find().sort({ created_at: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await collection.deleteOne(query);
      res.send(result);
    });

    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const query = { _id: id };
      const update = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };
      const result = await collection.updateOne(query, update);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Smart deals Server is running on port ${port}`);
});
