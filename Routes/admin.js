


const express = require('express');
const router = express.Router();
const Campground = require('../Models/campground.js');
const adminModel = require('../Models/admin.js');
const hostModel = require("../Models/host.js");
const requestModel = require("../Models/request.js"); 
const postModel = require("../Models/post.js");
const Review = require("../Models/review.js");
const Trip=require('../Models/trip.js'); 
const User = require("../Models/user.js");
const { AdminSchema } = require("../schemas.js");
const catchAsync = require("../catchAsync.js");
 
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
       service: 'gmail',
       auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
       },
});

const validateAdmin = (req, res, next) => {
       const { error } = AdminSchema.validate(req.body);
       if (error) {
              const msg = error.details.map(el => el.message).join(',');
              req.flash('error', msg);
              return res.redirect('/admin/login');
       } else {
              next();
       }
}

router.get('/login', (req, res) => {
       res.render('./admin/login.ejs');
})

router.post('/login', validateAdmin, catchAsync(async (req, res) => {
       const { adminname, password } = req.body.admin;
       const admin = await adminModel.findByadminnameAndValidate({ adminname, password });
       if (!admin) {
              req.flash('error', 'Invalid Username or Password');
              return res.redirect('/admin/login');
       }
       req.session.admin = admin;
       req.flash('success', 'LoggedIn Successfully');
       res.redirect('/admin/profile');
}))

router.use((req, res, next) => {
       if (!req.session.admin) {
              req.flash('error', 'You are not authorised to do this');
              return res.redirect('/admin/login');
       }
       next();
})

router.get('/logout', (req, res) => {

       for (let key in req.session) {
              if (key !== 'cookie') {
                     delete req.session[key];
              }
       }

       req.flash('success', 'Logged Out Successfully');
       res.redirect('/');

})

router.get('/profile', catchAsync(async (req, res) => {
       const requests = await requestModel.find({ status: "pending" }).populate("campgroundId");
       res.render('./admin/profile.ejs', { requests });
}));

router.get('/requests/:requestid', catchAsync(async (req, res) => {
       const request = await requestModel.findById(req.params.requestid).populate("campgroundId");
       res.render('./request_display.ejs', { request });
}))

router.post('/requests/:requestid/approve', catchAsync(async (req, res) => {
       const r = await requestModel.findById(req.params.requestid);
       if (r) {
              r.status = "approved";
              r.settledby = req.session.admin.id;
              await r.save();
              req.flash('success', "Request approved Successfully");
              return res.redirect('/admin/profile');
       } else {
              req.flash('error', 'Invalid Request Id');
              return res.redirect('/admin/profile');
       }
}))

router.post('/requests/:requestid/reject', catchAsync(async (req, res) => {
       const r = await requestModel.findById(req.params.requestid);
       if (r) {
              r.status = "rejected";
              r.settledby = req.session.admin.id;
              await r.save();
              req.flash('success', "Request rejected Successfully");
              return res.redirect('/admin/profile');
       } else {
              req.flash('error', 'Invalid Request Id');
              return res.redirect('/admin/profile');
       }
}))

router.get('/users', catchAsync(async(req, res) => {
        const all=await User.find({reported:true});
       res.render('./admin/userlist.ejs',{all});
}))

router.get('/posts',catchAsync(async(req,res)=>{
       const all=await postModel.find({reported:true}).populate('useruploaded');
       console.log(all);
       res.render('./admin/postlist',{all});
})) 


router.delete('/users/:username', catchAsync(async (req, res) => {
  const { username } = req.params;
  const { msg } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    req.flash('error', 'User not found');
    return res.redirect('/admin/users');
  }


  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Account Deletion',
    text: `Hi ${user.username},\n\nYour account has been deleted for the following reason:\n${msg}`,
  });


  for (let postId of user.posts) {
    await postModel.findByIdAndDelete(postId);
  }


  for (let tripId of user.trips) {
    const trip = await Trip.findById(tripId);
    if (trip) {
      trip.users.pull(user._id);
      if (trip.users.length === 0) {
        await Trip.findByIdAndDelete(tripId);
      } else {
        await trip.save();
      }
    }
  }


  const deletedReviews = await Review.find({ author: user._id });
  const deletedReviewIds = deletedReviews.map(r => r._id);
  await Review.deleteMany({ author: user._id });

  const campsToUpdate = await Campground.find({ reviews: { $in: deletedReviewIds } });
  for (let camp of campsToUpdate) {

    deletedReviewIds.forEach(id => camp.reviews.pull(id));

  
    let sum = 0;
    for (let reviewId of camp.reviews) {
      const review = await Review.findById(reviewId);
      sum += review?.rating || 0;
    }
    camp.rating = camp.reviews.length > 0 ? Number((sum / camp.reviews.length).toFixed(2)) : 0;

    await camp.save();
  }


  await User.deleteOne({ username });

  req.flash('success', 'User deleted and email sent');
  res.redirect('/admin/users');
}));



router.delete('/posts/:postid', catchAsync(async (req, res) => {
  const { postid } = req.params;
  const { msg } = req.body;

  const post = await postModel.findById(postid);
  if (!post) {
    req.flash('error', 'Post not found');
    return res.redirect('/admin/posts');
  }

  const user = await User.findById(post.useruploaded);
  if (user) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Post Deletion Notification',
      text: `Hi ${user.username},\n\nYour post with ID ${post.id} has been deleted for the following reason:\n${msg}`,
    }); 
  }
  user.posts.pull(postid);
  await user.save();
  await postModel.findByIdAndDelete(postid);

  req.flash('success', 'Post deleted successfully');
  res.redirect('/admin/posts');
}));

router.post('/posts/:postid/unreport', catchAsync(async (req, res) => {
  const { postid } = req.params;
  const post = await postModel.findById(postid);

  if (!post) {
    req.flash('error', 'Post not found');
    return res.redirect('/admin/posts');
  }

  post.reported = false;
  await post.save();

  req.flash('success', 'Post unreported successfully');
  res.redirect('/admin/posts');
}));


router.delete('/hosts/:id', catchAsync(async (req, res) => {
  const { msg } = req.body;

  const host = await hostModel.findById(req.params.id);
  if (!host) {
    return res.status(404).json({ error: 'Host not found' });
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: host.email,
    subject: 'Account Deletion',
    text: `Hi ${host.hostname || 'Host'},\n\nYour Host Account has been deleted for the following reason:\n${msg}`,
  });

  await hostModel.findByIdAndDelete(req.params.id);

      req.flash( 'success','Host account deleted and email sent');
      res.redirect('/admin/hosts');
}));

router.post('/users/:username/unreport',catchAsync(async(req,res)=>{
      const user=await User.findOne({username:req.params.username});
      user.reported=false;
      await user.save();
      req.flash('success','Unreported successfully');
      res.redirect('/admin/users');
}))

 

module.exports = router;

