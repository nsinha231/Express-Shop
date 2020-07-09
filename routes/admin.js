const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const indexController = require('../controllers/index');
const userController = require('../controllers/user');
const {
  catchErrors,
  upload,
  saveFile,
  deleteAllFiles,
} = require('../controllers/helpers');

/**
 * Admin ROUTES: /admin
 */

router.param('slug', indexController.getProductBySlug);

router.get(
  '/panel',
  userController.checkAuth,
  catchErrors(adminController.adminpanel)
);

router
  .route('/create')
  .get(userController.checkAuth, adminController.createProduct)
  .post(
    userController.checkAuth,
    upload.fields([
      { name: 'photos', maxCount: 6 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    catchErrors(saveFile),
    catchErrors(adminController.sendProduct)
  );

router
  .route('/:slug')
  .delete(
    userController.checkAuth,
    catchErrors(deleteAllFiles),
    catchErrors(adminController.deleteProduct)
  )
  .put(
    userController.checkAuth,
    upload.fields([
      { name: 'photos', maxCount: 6 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    catchErrors(saveFile),
    catchErrors(deleteAllFiles),
    catchErrors(adminController.updateProduct)
  )
  .get(userController.checkAuth, adminController.sendProductForm);

router.get(
  '/all/users',
  userController.checkAuth,
  catchErrors(adminController.getUsers)
);

router.get(
  '/all/products',
  userController.checkAuth,
  catchErrors(adminController.getProducts)
);

router.get(
  '/all/files',
  userController.checkAuth,
  catchErrors(adminController.getFiles)
);

module.exports = router;
