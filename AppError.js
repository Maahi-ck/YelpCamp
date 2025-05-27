class AppError extends Error{
       constructor(status=404,message="Something Went Wrong"){
                super();
                this.status=status;
                this.message=message;
       }
}

module.exports=AppError;