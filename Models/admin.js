

const mongoose=require("mongoose");
const bcrypt=require("bcrypt");

const adminSchema=mongoose.Schema({
       adminname:{
          type:String,
          required:true,
          unique:true
       },
       password:{
          type:String,
          required:true
       },
       enrolled:{
           type:Date,
           default:Date.now
       }
       
});


adminSchema.statics.findByadminnameAndValidate = async ({ adminname, password }) => {
  const admin = await adminModel.findOne({ adminname });
  if (!admin) return false;
  const isValid = await bcrypt.compare(password, admin.password);
  return isValid==true ? admin : null;
};

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});



const adminModel=mongoose.model('admin',adminSchema);
module.exports=adminModel;