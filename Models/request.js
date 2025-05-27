

const host=require('./host.js');
const mongoose=require('mongoose');
const campground = require('./campground');
const { object, required } = require('joi');
const adminModel=require('./admin.js');

const requestSchema=mongoose.Schema({
       campgroundId:{
           type:mongoose.Schema.Types.ObjectId,
          ref:'Campground',
          required:false
       },
       hostId:{
           type:mongoose.Schema.Types.ObjectId,
           required:true,
          ref:'host'
       }
       ,
       type:{
            type:String,
            enum:['edit','add','delete'],
            required:true
       },
       body:{
         type:mongoose.Schema.Types.Mixed,
       
       },
       status:{
          type:String,
          enum:['pending','approved','rejected','submitted'],
          default:'pending'
       },
       settledby:{
            type:mongoose.Schema.Types.ObjectId,
            default:null,
            ref:'admin'
       },
       createdAt:{
          type:Date,
          default:Date.now()
       }

});


const requestModel=new mongoose.model('request',requestSchema);
module.exports=requestModel;