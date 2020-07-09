const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  text: { type: String, required: true },
  stars: { type: Number },
  createdAt: { type: Date, default: Date.now },
  postedBy: { type: Schema.ObjectId, ref: 'User', required: 'User' },
});

/* Kind of like a middleware function after creating our schema (since we have access to next) */
/* Must be a function declaration (not an arrow function), because we want to use 'this' to reference our schema */
const autoPopulateCommentedBy = function (next) {
  this.populate('postedBy', '_id avatar username');
  next();
};

/* We're going to need to populate the 'postedBy' field virtually every time we do a findOne / find query, so we'll just do it as a pre hook here upon creating the schema */
reviewSchema
  .pre('findOne', autoPopulateCommentedBy)
  .pre('find', autoPopulateCommentedBy);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
