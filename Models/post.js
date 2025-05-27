const mongoose = require('mongoose');
const trip = require('./trip.js');
const User = require('./user.js');

const postSchema = mongoose.Schema({
  useruploaded: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user'
  },
  date: {
    type: Date,
    required: true
  },
  tripid: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'trip'
  },
  images: [String],
  description: String,
  reported:{
      type:Boolean,
      default:false
  }
});


const postModel = mongoose.model('post', postSchema);
module.exports = postModel;
