
const mongoose=require("mongoose");
const Review=require('./review.js');
const user=require('./user.js');
 
const schema= mongoose.Schema;
const opts={ toJSON:{virtuals:true} };

const campgroundSchema=new schema({
      title:{
             type:String,
             required:true,
             index:true
      },
      price:{
             type:Number,
             required:true,
             min:0
      },
      description:{
             type:String,
             required:true
      },
      location:{
             type:String,
             required:true
      },
      rating:{
             type:Number,
             default:0
      },
      images:[{
             type:String,
             required:true
      }],
      reviews:[{
           type:mongoose.Schema.Types.ObjectId,
           ref:'Review'
      }],
      host:{
           type:mongoose.Schema.Types.ObjectId,
           ref:'user'
      },
      geometry:{
             type:{
                 type:String,
                 enum:['Point'],
                 required:true
             },
             coordinates:{
                type:[Number],
                required:true
             }
      }
},opts);

campgroundSchema.virtual('properties.popUp').get(function(){
          return `<a href="/campgrounds/${this._id}">${this.title}</a>`
})

module.exports=mongoose.model('Campground',campgroundSchema);
