
const mongoose=require('mongoose');
const User=require('./user.js');
const Campground=require('./campground.js');
const tripSchema=mongoose.Schema({
       date:{
          type:Date,
          required:true 
       },
       destination:{
           type:mongoose.Schema.Types.ObjectId,
           ref:'Campground'
       },
       users:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:'user'
       }]
       ,
       days:{type:Number,required:true},
       price:{type:Number,required:true}
})



const tripModel=mongoose.model('trip',tripSchema);
module.exports=tripModel;