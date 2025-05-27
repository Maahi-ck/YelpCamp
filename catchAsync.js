const catchAsync= (fn)=>{
     return function(req,res,next){
         try{
            fn(req,res,next);
         }catch(err){
           return next(new AppError(500,err));
         }
     }
}

module.exports=catchAsync;