const mongoose = require('mongoose');
const shortId = require('crypto-random-string');
const URLSlugs = require('mongoose-url-slugs');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

function URI() {
  return (random = shortId({ length: 12 }));
}

const productSchema = new Schema({
  title: { type: String, required: true },
  productCode: { type: String, default: URI },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  body: { type: String, required: true },
  photos: [{ type: Schema.Types.ObjectId, ref: 'File', required: true }],
  thumbnail: { type: Schema.Types.ObjectId, ref: 'File', required: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: Schema.ObjectId, ref: 'User' }],
  reviews: [{ type: Schema.ObjectId, ref: 'Review' }],
});

/* Kind of like a middleware function after creating our schema (since we have access to next) */
/* Must be a function declaration (not an arrow function), because we want to use 'this' to reference our schema */
const autoPopulate = function (next) {
  this.populate('seller', '_id username avatar username');
  this.populate('photos thumbnail', '_id contentType filename fileID size');
  this.populate('reviews', '_id text stars createdAt postedBy');
  next();
};

/* We're going to need to populate the 'postedBy' field virtually every time we do a findOne / find query, so we'll just do it as a pre hook here upon creating the schema */
productSchema.pre('findOne', autoPopulate).pre('find', autoPopulate);

/* The URLSlug plugin creates a slug that is human-readable unique identifier that can be used in a URL instead of an ID or hash*/
productSchema.plugin(URLSlugs('title code'));

/* The mongoosePaginate plugin adds paginate method to the Model for Pagination*/
productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);
