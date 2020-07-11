const express = require('express');
const router = express.Router();
const indexController = require('../controllers/index');
const userController = require('../controllers/user');
const { catchErrors, sendFiles } = require('../controllers/helpers');

/**
 * POST ROUTES: /
 */
router.get('/', catchErrors(indexController.getProducts));

router.param('username', userController.getUserByUsername);

router
  .route('/cart/:username')
  .get(userController.checkAuth, catchErrors(indexController.getCart))
  .post(userController.checkAuth, catchErrors(indexController.postCart));

router.post(
  '/cart-delete-item',
  userController.checkAuth,
  catchErrors(indexController.postCartDeleteProduct)
);

router.get(
  '/checkout',
  userController.checkAuth,
  catchErrors(indexController.getCheckout)
);

router.post(
  '/create-order',
  userController.checkAuth,
  catchErrors(indexController.postOrder)
);

router.get(
  '/orders',
  userController.checkAuth,
  catchErrors(indexController.getOrders)
);

router.get(
  '/orders/:orderId',
  userController.checkAuth,
  indexController.getInvoice
);

router.get('/files/:filename', sendFiles);

router.param('slug', indexController.getProductBySlug);

router.put(
  '/:slug/like',
  userController.checkAuth,
  catchErrors(indexController.toggleLike)
);

router.put(
  '/:slug/unlike',
  userController.checkAuth,
  catchErrors(indexController.toggleLike)
);

router.put(
  '/:slug/review',
  userController.checkAuth,
  catchErrors(indexController.toggleReview)
);

router.put(
  '/:slug/remove_review',
  userController.checkAuth,
  catchErrors(indexController.toggleReview)
);

router.put(
  '/:slug/save',
  userController.checkAuth,
  catchErrors(userController.toggleSavedProducts)
);

router.put(
  '/:slug/remove',
  userController.checkAuth,
  catchErrors(userController.toggleSavedProducts)
);

router.post(
  '/search',
  userController.checkAuth,
  catchErrors(indexController.searchProduct),
  indexController.sendProduct
);

router
  .route('/:slug')
  .get(userController.checkAuth, indexController.sendProduct);

module.exports = router;
