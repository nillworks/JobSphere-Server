const express = require('express');
const app = express();
const cors = require('cors');
const dotEnv = require('dotenv');
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
    // await client.connect();
    // await client.db('admin').command({ ping: 1 });

    // Mongodb Data Collection
    const JobSphere = client.db('JobSphere');
    const jobDataCollection = JobSphere.collection('jobData');
    const companyCollection = JobSphere.collection('company');
    const applicationCollection = JobSphere.collection('application');
    const planCollection = JobSphere.collection('plans');

    // Get All Jobs API
    app.get('/api/jobs', async (req, res) => {
      try {
        const result = await jobDataCollection.find().toArray();
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: 'Failed to fetch jobs',
          error: error.message,
        });
      }
    });

    // get Single Jobs
    app.get('/api/job-details/:id', async (req, res) => {
      try {
        const id = req.params.id;

        const query = { _id: new ObjectId(id) };
        const result = await jobDataCollection.findOne(query);

        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: 'Failed to fetch job',
          error: error.message,
        });
      }
    });

    // Get limit 8 Jobs API
    app.get('/api/jobs/limit', async (req, res) => {
      try {
        const result = await jobDataCollection.find().limit(8).toArray();

        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: 'Failed to fetch jobs',
          error: error.message,
        });
      }
    });

    // Get All Company API
    app.get('/api/company', async (req, res) => {
      try {
        const result = await companyCollection.find().toArray();
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: 'Failed to fetch jobs',
          error: error.message,
        });
      }
    });

    // Recruiter jobs Filter Get Api
    app.get('/api/recruiter/job/:id', async (req, res) => {
      try {
        const userId = req.params.id;

        const jobs = await jobDataCollection.find({ userId: userId }).toArray();

        res.status(200).json({
          success: true,
          data: jobs,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch companies',
          error: error.message,
        });
      }
    });

    //  Recruiter jobs Post Api
    app.post('/api/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobDataCollection.insertOne(newJob);
      res.send(result);
    });

    // Recruiter company information Post api
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

    // Recruiter company  filter information Get api
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

    // get application related apis
    app.get('/api/application', async (req, res) => {
      const applicantId = req.query.applicantId;
      console.log(applicantId);

      const result = await applicationCollection
        .find({ applicantId })
        .toArray();

      res.send(result);
    });

    // Apply Post New
    app.post('/api/application', async (req, res) => {
      try {
        const application = req.body;
        const newApplication = {
          ...application,
          createdAt: new Date(),
        };

        if (!newApplication) {
          return res.status(400).send({
            success: false,
            message: 'Application data is required',
          });
        }

        const result = await applicationCollection.insertOne(newApplication);

        res.status(201).send({
          success: true,
          message: 'Application submitted successfully',
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: 'Failed to submit application',
          error: error.message,
        });
      }
    });

    app.get('/api/plans', async (req, res) => {
      const query = {};

      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      }

      const plan = await planCollection.findOne(query);

      res.send(plan);
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
