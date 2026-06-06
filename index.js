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
    const companyCollection = JobSphere.collection('company');

    // Post Api jobs
    app.post('/api/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobDataCollection.insertOne(newJob);
      res.send(result);
    });

    // company information Post api
    app.post('/api/company', async (req, res) => {
      try {
        const newCompany = req.body;

        const result = await companyCollection.insertOne(newCompany);

        res.status(201).json({
          success: true,
          message: 'Company created successfully',
          insertedId: result.insertedId,
          data: {
            ...newCompany,
            _id: result.insertedId,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to create company',
          error: error.message,
        });
      }
    });

    app.get('/api/recruiter/company/:id', async (req, res) => {
      try {
        const recruiterId = req.params.id;

        const companies = await companyCollection
          .find({ recruiterId: recruiterId })
          .toArray();

        res.status(200).json({
          success: true,
          data: companies,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch companies',
          error: error.message,
        });
      }
    });

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!',
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('JobSphere Server is running');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
