const mongoose = require('mongoose');

// MongoDB Config
const MONGODB_URI = process.env.MONGODB_URI;
const mongoDBOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, mongoDBOptions)
  .then(() => console.info(`MongoDB is Connected on ${MONGODB_URI}`))
  .catch((err) =>
    console.error(`Unable to connect MongoDB due to ${err.message}`)
  );

// Promise of mongoose
mongoose.Promise = global.Promise;
