

const { required } = require("joi");
const mongoose=require("mongoose");
const campground=require('./campground.js');
const request=require('./request.js');
const bcrypt = require('bcrypt');
const hostSchema=mongoose.Schema({
        hostname:{
              type:String,
              required:true,
              unique:true
        }
        ,
        password:{
             type:String,
             required:true
        },
        campgrounds:[{
              type:mongoose.Schema.Types.ObjectId,
              ref:'Campground',
              
        }]
        ,
        requests:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:'request'
        }],
        profilepic:{
             type:String
        },
        enrolled:{
            type:Date,
            default:Date.now
        },
        email:{
           type:String,
           email:required
        }
});


hostSchema.statics.findByHostnameAndValidate = async function({ hostname, password }) {
  const host = await hostModel.findOne({ hostname });
  if (!host) return false;
  const isValid = await bcrypt.compare(password, host.password);
  return isValid===true ? host : null;
};

// Hash password before saving
hostSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const hostModel=new mongoose.model('host',hostSchema);
module.exports=hostModel;

