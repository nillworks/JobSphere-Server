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
    const subscriptionsCollection = JobSphere.collection('subscriptions');
    const userCollection = JobSphere.collection('user');
    const sessionCollection = JobSphere.collection('session');

    const verifyToken = async (req, res, next) => {
      const authHeader = req?.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      try {
        // const { payload } = await jwtVerify(token, JWKS);
        // console.log(payload);

        const query = { token: token };
        const session = await sessionCollection.findOne(query);

        const userId = session.userId;
        const userQuery = { _id: userId };

        const user = await userCollection.findOne(userQuery);

        req.user = user;

        next();
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    };

    const verifySeeker = async (req, res, next) => {
      if (req.user?.role !== 'seeker') {
        return res.status(403).send({ massage: 'forbidden access' });
      }
      next();
    };

    const verifyRecruiter = async (req, res, next) => {
      if (req.user?.role !== 'recruiter') {
        return res.status(403).send({ massage: 'forbidden access' });
      }
      next();
    };
    const verifyAdmin = async (req, res, next) => {
      if (req.user?.role !== 'admin') {
        return res.status(403).send({ massage: 'forbidden access' });
      }
      next();
    };

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
    app.get('/api/job-details/:id', verifyToken, async (req, res) => {
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
    app.get('/api/company', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const companies = await companyCollection.find().toArray();

        for (const company of companies) {
          const filter = {
            companyId: company._id.toString(),
          };
          const jobCount = await jobDataCollection.countDocuments(filter);
          company.jobCount = jobCount;
        }

        res.status(200).send(companies);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: 'Failed to fetch jobs',
          error: error.message,
        });
      }
    });

    // Recruiter jobs Filter Get Api
    app.get(
      '/api/recruiter/job/:id',
      verifyToken,
      verifyRecruiter,
      async (req, res) => {
        try {
          const userId = req.params.id;

          const jobs = await jobDataCollection
            .find({ userId: userId })
            .toArray();

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
      },
    );

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

    // update admin Company Approve or reject
    app.patch(
      '/api/company/:id',
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;

        const filter = { _id: new ObjectId(id) };
        const updatedCompany = req.body;

        const updateDoc = {
          $set: {
            status: updatedCompany.status,
          },
        };

        const result = await companyCollection.updateOne(filter, updateDoc);

        res.send(result);
      },
    );

    // Recruiter company  filter information Get api
    app.get(
      '/api/recruiter/company/:id',
      verifyToken,
      verifyRecruiter,
      async (req, res) => {
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
      },
    );

    // get application related apis
    app.get('/api/application', verifyToken, verifySeeker, async (req, res) => {
      const query = {};
      if (req.query.applicantId) {
        query.applicantId = req.query.applicantId;

        if (req.user._id.toString() !== req.query.applicantId) {
          return res.status(403).send({ message: 'forbidden access' });
        }
      }
      // const applicantId = req.query.applicantId;
      // console.log(applicantId);

      const result = await applicationCollection.find(query).toArray();

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

    // Plans Get filter user Id
    app.get('/api/plans', async (req, res) => {
      const query = {};

      if (req.query.plan_id) {
        query.plan_id = req.query.plan_id;
      }

      const plan = await planCollection.findOne(query);

      res.send(plan || {});
    });

    // subscriptions
    app.post('/api/subscriptions', async (req, res) => {
      const data = req.body;

      const subsInfo = {
        ...data,
        createdAt: new Date(),
      };

      const result = await subscriptionsCollection.insertOne(subsInfo);

      const filter = { email: data.email };
      const updateDocument = {
        $set: {
          plan: data.planId,
        },
      };

      const upDateResult = await userCollection.updateOne(
        filter,
        updateDocument,
      );

      res.send(upDateResult);
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
