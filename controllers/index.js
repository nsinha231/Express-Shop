// Load model
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Review = require('../models/review');
const PDFDocument = require('pdfkit');
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.getProductBySlug = async (req, res, next, slug) => {
  try {
    req.product = await Product.findOne({ slug: slug });
    if (req.product !== null) {
      return next();
    }
    req.flash(
      'error_msg',
      `No Product with slug: ${slug}, may be because slug is incorrect or modified`
    );
    res.redirect('/');
  } catch (error) {
    next(error);
  }
};

exports.searchProduct = async (req, res) => {
  const code = req.body.code;
  req.product = await Product.findOne({ productCode: code });
  if (req.product !== null) {
    return res.redirect(`/${req.product.slug}`);
  }
  req.flash(
    'error_msg',
    `No Product with Product Code: ${code}, may be because product code is incorrect`
  );
  res.redirect('/');
};

exports.sendProduct = (req, res) => {
  res.render('shop/product', {
    PAGE_PATH: 'index',
    PAGE_TITLE: req.product.title,
    product: req.product,
    user: req.user,
  });
};

exports.getProducts = async (req, res) => {
  const options = {
    page: req.query.page || 1,
    limit: req.query.limit || 4,
  };
  const products = await Product.paginate({}, options);
  res.render('shop/index', {
    PAGE_TITLE: 'All Products',
    PAGE_PATH: 'index',
    products,
  });
};

exports.toggleLike = async (req, res) => {
  const { _id } = req.product;
  const product = await Product.findOne({ _id: _id });
  const likeIds = product.likes.map((id) => id.toString());
  const authUserId = req.user._id.toString();
  if (likeIds.includes(authUserId)) {
    req.flash(
      'success_msg',
      `${req.product.title} removed from liked products`
    );
    await product.likes.pull(authUserId);
  } else {
    req.flash('success_msg', `${req.product.title} added to liked products`);
    await product.likes.push(authUserId);
  }
  await product.save();
  res.redirect(`/${req.product.slug}`);
};

exports.toggleReview = async (req, res) => {
  let review;
  let operator;
  if (req.url.includes('remove_review')) {
    operator = '$pull';
    review = await Review.findByIdAndDelete(req.body.id);
    req.flash('success_msg', `${review.text} deleted from product`);
  } else {
    operator = '$push';
    review = await new Review({
      text: req.body.review,
      stars: req.body.stars,
      postedBy: req.user._id,
    });
    await review.save();
    req.flash('success_msg', `Added your review to product`);
  }
  await Product.findOneAndUpdate(
    { _id: req.product._id },
    { [operator]: { reviews: review._id } },
    { new: true }
  );
  res.redirect(`/${req.product.slug}`);
};

exports.getCart = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'cart.items.productId',
    select: '-photos -body -reviews -likes',
  });
  const products = user.cart.items;
  res.render('shop/cart', {
    PAGE_PATH: 'cart',
    PAGE_TITLE: 'Your Cart',
    products: products,
    profile: req.profile,
  });
};

exports.postCart = async (req, res) => {
  const prodId = req.body.productId;
  const product = await Product.findById(prodId);
  req.user.addToCart(product);
  res.redirect(`/cart/${req.user.username}`);
};

exports.postCartDeleteProduct = async (req, res) => {
  const prodId = req.body.productId;
  await req.user.removeFromCart(prodId);
  res.redirect(`/cart/${req.user.username}`);
};

exports.getCheckout = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'cart.items.productId',
    select: '-photos -body -reviews -likes',
  });
  const products = user.cart.items;
  let total = 0;
  products.forEach((product) => {
    total += product.quantity * product.productId.price;
  });
  res.render('shop/checkout', {
    PAGE_PATH: 'orders',
    PAGE_TITLE: 'Checkout',
    products: products,
    totalSum: total,
  });
};

exports.postOrder = async (req, res) => {
  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express
  let totalSum = 0;
  const user = await User.findById(req.user._id).populate({
    path: 'cart.items.productId',
    select: '-photos -body -reviews -likes',
  });
  user.cart.items.forEach((p) => {
    totalSum += p.quantity * p.productId.price;
  });
  const products = user.cart.items.map((i) => {
    return { quantity: i.quantity, product: { ...i.productId._doc } };
  });
  const order = new Order({
    user: {
      email: user.email,
      userId: user.id,
      userAddress: user.address,
    },
    products: products,
  });
  await order.save();
  stripe.charges.create({
    amount: totalSum * 100,
    currency: 'inr',
    description: 'Demo Order',
    source: token,
    metadata: {
      order_id: order._id.toString(),
      address: `${user.address.flat}, ${user.address.street},
      ${user.address.pincode} ${user.address.state}`,
    },
  });
  req.user.clearCart();
  res.redirect('/orders');
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find({ 'user.userId': req.user._id });
  res.render('shop/orders', {
    PAGE_PATH: 'orders',
    PAGE_TITLE: 'Your Orders',
    orders: orders,
  });
};

exports.getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new Error('No order found.'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Unauthorized'));
    }
    const invoiceName = `invoice-${orderId}.pdf`;
    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoiceName}"`
    );
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice', {
      underline: true,
    });
    pdfDoc.fontSize(26).text('-----------------------');
    let totalPrice = 0;
    order.products.forEach((prod) => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc
        .fontSize(20)
        .text(
          `${prod.product.title} -  ${prod.quantity} x Rupee ${prod.product.price}`
        );
    });
    pdfDoc.fontSize(26).text('-----------------------');
    pdfDoc.fontSize(20).text(`Total Price: Rupee ${totalPrice}`);
    pdfDoc.fontSize(20).text(`Address`);
    pdfDoc.fontSize(26).text('-----------------------');
    pdfDoc.fontSize(20).text(
      `${req.user.address.flat}, ${req.user.address.street},
      ${req.user.address.pincode} ${req.user.address.state},`
    );
    pdfDoc.fontSize(26).text('-----------------------');
    pdfDoc.end();
  } catch (error) {
    return next(error);
  }
};
