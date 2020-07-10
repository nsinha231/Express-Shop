const File = require('../models/file');
const mongoose = require('mongoose');
const Multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

let GFS;

mongoose.connection.once('open', () => {
  GFS = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: process.env.bucketName,
  });
});

/* Error handler for async / await functions */
const catchErrors = (fn) => {
  return function (req, res, next) {
    return fn(req, res, next).catch(next);
  };
};

const storage = new GridFsStorage({
  url: process.env.mongoDBURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: process.env.bucketName,
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = Multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // no larger than 10mb, you can change as needed.
  },
  fileFilter: (req, file, next) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('application/')
    ) {
      next(null, true);
    } else {
      next(null, false);
    }
  },
});

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const savingFile = async (file) => {
  try {
    let files = new File({
      contentType: file.contentType,
      filename: file.filename,
      fileID: file.id,
      size: formatBytes(file.size),
    });
    let { id } = await files.save();
    return Promise.resolve(id);
  } catch (error) {
    return Promise.reject(error);
  }
};

const saveFile = async (req, res, next) => {
  if (!req.files) {
    return next();
  }
  await async.parallel([
    async () => {
      if (req.files['avatar']) {
        const file = req.files['avatar'][0];
        req.body.avatar = await savingFile(file);
      }
      return;
    },
    async () => {
      if (req.files['photos']) {
        const photos = req.files['photos'];
        const arrayOfPhoto = [];
        const saveEach = async (photo) => {
          let id = await savingFile(photo);
          arrayOfPhoto.push(id);
        };
        await async.each(photos, saveEach);
        req.body.photos = new Array(...arrayOfPhoto);
      }
      return;
    },
    async () => {
      if (req.files['thumbnail']) {
        const file = req.files['thumbnail'][0];
        req.body.thumbnail = await savingFile(file);
      }
      return;
    },
  ]);
  return next();
};

const deleteFileFromBucket = async (file) => {
  try {
    return await GFS.delete(new mongoose.Types.ObjectId(file.fileID));
  } catch (error) {
    return Promise.reject(error);
  }
};

const checkAndChangeProfile = async (req, res, next) => {
  const { avatar } = req.profile;
  if (
    (avatar !== undefined && req.body.avatar !== undefined) ||
    (avatar !== undefined && req.url.includes('DELETE'))
  ) {
    await deleteFileReference(avatar);
  }
  return next();
};

const deleteFileReference = async (file) => {
  await async.parallel([
    (callback) => {
      File.findByIdAndDelete(file._id).exec(callback);
    },
    async () => {
      await deleteFileFromBucket(file);
    },
  ]);
};

const deleteAllFiles = async (req, res, next) => {
  const { photos, thumbnail } = req.post;
  await async.parallel([
    async () => {
      if (req.body.thumbnail !== undefined || req.url.includes('DELETE')) {
        await deleteFileReference(thumbnail);
      }
      return;
    },
    async () => {
      if (req.body.photos !== undefined || req.url.includes('DELETE')) {
        await async.each(photos, deleteFileReference);
      }
      return;
    },
  ]);
  return next();
};

const sendFiles = async (req, res, next) => {
  try {
    const files = await GFS.find({ filename: req.params.filename }).toArray();
    if (!files[0] || files.length === 0) {
      return res
        .status(200)
        .json({ success: false, message: 'No files available' });
    }
    if (files[0].contentType.startsWith('image')) {
      GFS.openDownloadStreamByName(req.params.filename).pipe(res);
    } else {
      res.status(404).json({ err: 'Not a image' });
    }
  } catch (error) {
    return next(error);
  }
};

const transport = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: process.env.emailAddress,
    pass: process.env.emailPassword,
  },
});

const sendEmail = async (req, user, key) => {
  let link, message;
  if (key === 'signup') {
    link = `${req.protocol}://${req.get('host')}/auth/verify/${user.id}`;
    message = {
      from: `${process.env.emailAddress} Express Shop`,
      to: user.email,
      subject: 'Please verify your Email to login to Express Shop.',
      html: `
          <h1>Verify your email</h1>
          <p>Click this <a href="${link}" target="_blank" rel="noopener noreferrer">link</a> to Verify.</p>`,
    };
  } else {
    link = `${req.protocol}://${req.get('host')}/auth/reset/${key}`;
    message = {
      from: `${process.env.emailAddress} Express Shop`,
      to: req.body.email,
      subject: 'Password reset',
      html: `
          <h1>You requested a password reset</h1>
          <p>Click this <a href="${link}" target="_blank" rel="noopener noreferrer">link</a> to set a new password.</p>`,
    };
  }
  try {
    await transport.sendMail(message);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  catchErrors,
  upload,
  saveFile,
  checkAndChangeProfile,
  deleteAllFiles,
  sendFiles,
  sendEmail,
};
