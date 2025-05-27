const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const user = require('./user.js');

const reviewSchema = new Schema({
  body: {
    type: String,
    required: [true, "Review is required"]
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: 0,
    max: 5
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  campground: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campground',
    required: true
  }
});




module.exports = mongoose.model('Review', reviewSchema);
