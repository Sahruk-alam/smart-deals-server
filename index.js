const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;

const uri =
  "mongodb+srv://smartDeals:3yV0xfY16HZCmiQk@cluster0.jfbqb9o.mongodb.net/?appName=Cluster0";
const app = express();
app.use(cors());
app.use(express.json());

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

    app.get('/products/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await collection.findOne(query);
        res.send(result);
    })
    app.get("/products", async (req, res) => {
      // const projectFields = { title: 1, price_min: 1 };
      //   const cursor=collection.find().sort({price_min:1}).skip(4)
      //   .limit(3).project(projectFields);
      console.log(req.query);

      const email = req.query.email;
      const query={}
      if(email){
        query.email=email;
      }
        const cursor=collection.find(query);
        const result=(await cursor.toArray());
        res.send(result);
    })
    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await collection.insertOne(newProduct);
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await collection.deleteOne(query);
      res.send(result);
    });
    
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const query={_id: new ObjectId(id)}
      const update={
    $set:{
        name : updatedProduct.name,
        price : updatedProduct.price
    }

}   
 const result=await collection.updateOne(query,update)
 res.send(result)
});

// bids api
app.get("/bids", async (req, res) => {
  const email = req.query.email;
  const query={};
  if(email){
    query.buyer_email=email; 
  }
  console.log(query);
  const cursor=bidsCollection.find(query);
  const result=await cursor.toArray();
  res.send(result);
});

app.post("/bids", async (req, res) => {
  const newBids=req.body;
  const result=await bidsCollection.insertOne(newBids);
  res.send(result);
});


    await client.db("admin").command({ ping: 1 });
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
