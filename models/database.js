const mongoose = require('mongoose');

// MongoDB Config
const mongoDBURI = process.env.mongoDBURI;
const mongoDBOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

// Connect to MongoDB
mongoose
  .connect(mongoDBURI, mongoDBOptions)
  .then(() => console.info(`MongoDB is Connected on ${mongoDBURI}`))
  .catch((err) =>
    console.error(`Unable to connect MongoDB due to ${err.message}`)
  );

// Promise of mongoose
mongoose.Promise = global.Promise;

const connection = mongoose.connection;

connection.once('open', () => {
  const GFS = new mongoose.mongo.GridFSBucket(connection.db, {
    bucketName: process.env.bucketName,
  });
});

module.exports = { bucket: GFS };
