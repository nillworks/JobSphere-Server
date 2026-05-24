const express = require('express');
const app = express();
const cors = require('cors');
const dotEnv = require('dotenv');
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion } = require('mongodb');

dotEnv.config();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });

    // Mongodb Data Collection
    const JobSphere = client.db('JobSphere');
    const jobDataCollection = JobSphere.collection('jobData');

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!',
    );
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('JobSphere Server is running');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
