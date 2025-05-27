const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const trip = require('./trip.js');
const post = require('./post.js');
const Review = require('./review.js');
const passportLocalMongoose = require('passport-local-mongoose');
const { required } = require('joi');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "UserName Can't be Empty"],
    unique: true
  },
  email:{
       type:String,
       required:true
  },
  password: {
    type: String,
    required: [true, "Password Can't be Empty"]
  },
  trips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'trip'
  }],
  enrolled: {
    type: Date,
    required: true
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post',
    default: []
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: []
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: []
  }],
  profilepic: {
    type: String,
    default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpogIQ2ThaAXUrwOldKA-k2yxTfiHm4tJGmA&s"
  },
  reported:{
      type:Boolean,
      default:false
  }
});


// Custom static method for validating credentials
userSchema.statics.findByUsernameAndValidate = async ({ username, password }) => {
  const user = await userModel.findOne({ username });
  if (!user) return null;
  const isValid = await bcrypt.compare(password, user.password);
  return isValid===true ?user : null;
};

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.plugin(passportLocalMongoose);
const userModel = mongoose.model('user', userSchema);
module.exports = userModel;
