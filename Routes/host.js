const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken=process.env.MAPBOX_TOKEN;
const geocoder=mbxGeocoding({accessToken:mapBoxToken});

const express = require('express');
const Host = require('../Models/host.js');
const router = express.Router();
const Campground = require('../Models/campground.js');
const hostModel = require('../Models/host.js');
const requestModel = require("../Models/request.js");
const postModel = require("../Models/post.js");
const Review = require("../Models/review.js");
const User = require("../Models/user.js");
const { ReviewSchema, CampgroundSchema, HostSchema } = require("../schemas.js");
const mongoose = require('mongoose');
const AppError=require("../AppError.js");
const Trip=require("../Models/trip.js");
const catchAsync=require("../catchAsync.js");
const {storage}=require('../cloudinary/index.js');
const multer=require("multer");
const upload=multer({storage});

const validateHost = (req, res, next) => {
  const { error } = HostSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    req.flash('error', msg);
    return res.redirect('/host/login');
  } else {
    next();
  }
}

const validateCampground = (req, res, next) => {
  const { error } = CampgroundSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    req.flash('error', msg);
    return req.redirect(`/campgrounds/${req.params.id}`);
  } else {
    next();
  }
}


const validateReview = (req, res, next) => {
  const { error } = ReviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    req.flash('error', msg);
    return res.redirect(`/campgrounds/${req.params.id}`);
  } else {
    next();
  }
}


router.get('/login', (req, res) => {
  res.render('./host/login.ejs');
})

router.post('/login', catchAsync(async (req, res) => {
  const { hostname, password } = req.body.host;

  const host = await hostModel.findByHostnameAndValidate({ hostname, password }); 

  if (!host) {
    req.flash('error', 'Invalid Username or Password'); 
    return res.redirect('/host/login');
  }

  req.session.host = host;
  req.flash('success', 'Logged In Successfully');
  res.redirect('/host/profile');
})); 


router.use((req, res, next) => {
  if (!req.session.host) {
    req.flash('error', 'You are not authorised to do this');
    return res.redirect('/host/login');
  }
  next();
})
//host must be logged in for these


//apis
router.get('/campgrounds/all', catchAsync(async (req, res) => {
  const allCampgrounds = await Campground.find({ host: req.session.host.id });
  res.json(allCampgrounds);
}));

router.get('/campgrounds/search',catchAsync(async (req, res) => {

  const searchTerm = req.query.searchTerm || '';

    const getall = await Campground.find({
      host: req.session.host.id,
      title: { $regex: searchTerm, $options: 'i' }
    });


    res.send(getall);
}));
//----

router.get('/logout', (req, res) => {

  for (let key in req.session) {
    if (key !== 'cookie') {
      delete req.session[key];
    }
  }

  req.flash('success', 'Logged Out Successfully');
  res.redirect('/');

})
 

router.post('/campgrounds/:id/newrequest/:typehere',upload.array('Campground[images]'), catchAsync(async (req, res) => {

    const { typehere, id } = req.params;
    const campgroundId=id;
    const host = await hostModel.findById(req.session.host._id);

   
    if (!host || !host._id) {
      req.flash('error', 'Host must be logged in to submit a request.');
      return res.redirect('/host/login');
    }

    if (typehere !== 'add' && (!campgroundId || campgroundId === 'null')) {
      req.flash('error', 'Invalid request: Missing campground ID.');
      return res.redirect(`/host/campgrounds`);
    }
  
    // If type is "add", don't associate campgroundId
    if(req.files){
         req.body.Campground.images=req.files.map((e)=>{return e.path}  );
    }
    const newRequestData = {
      hostId: host._id,
      type: typehere,
      status: 'pending',
      body: req.body,
      createdAt: Date.now()
    };

    if (typehere !== 'add') {
      newRequestData.campgroundId = campgroundId;
    }

    const newrequest = new requestModel(newRequestData);
    await newrequest.save();

    if (!host.requests) host.requests = [];
    host.requests.push(newrequest._id);
    await host.save();
    req.session.host = host;

    req.flash('success', 'Request Submitted');
    return res.redirect('/host/profile'); 

}));


router.get('/profile', catchAsync(async (req, res) => {

  if (req.session.host && req.session.host.enrolled) {
    req.session.host.enrolled = new Date(req.session.host.enrolled); 
  }

  const requestIds = req.session.host?.requests || [];

  const requests = await requestModel.find({ _id: { $in: requestIds } }).populate("campgroundId");

  res.render('./host/profile', { requests });
}))

router.get('/campgrounds', catchAsync(async (req, res) => {
  
    const ids = req.session.host?.campgrounds || []; 
    const data = await Promise.all(ids.map(id => Campground.findById(id)));
    res.render('./host/index.ejs', { data });

}));

router.get('/campgrounds/new', (req, res) => {
  res.render('./host/new.ejs');
})

router.get('/campgrounds/:id', catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash('error', 'Invalid Id Format');
    return res.redirect('/host/campgrounds');
  }

    const data = await Campground.findById(id).populate({
      path: 'reviews',
      populate: { path: 'author' }
    });

    if (!data) {
      req.flash('error', 'Campground Not Found');
      return res.redirect('/host/campgrounds');
    }
    
    
    if (data && data.host._id != req.session.host._id) {
      req.flash('error', 'Unauthorized access');
      return res.redirect('/host/campgrounds');
    }

    
    res.render('./host/show.ejs', { data });
 
}));


router.post('/Profile/:requestid/submit', catchAsync(async (req, res, next) => {

    const requestId = req.params.requestid;
    const request = await requestModel.findById(requestId);

    if (!request) {
      req.flash('error', 'Request not found');
      return res.redirect('/host/profile');
    }

    const host = await hostModel.findById(request.hostId); 
    if (!host) {
      req.flash('error', 'Host not found');
      return res.redirect('/host/profile');
    }

    const data = request.body;
    if(request.type!='delete'){
         const geoData=  await geocoder.forwardGeocode({
               query: data.Campground.location,
               limit:1
         }).send();
         data.Campground.geometry=geoData.body.features[0].geometry;
    }

    if (request.type === 'edit') {
      const id = request.campgroundId;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error', 'Invalid campground ID');
        return res.redirect('/host/profile');
      }
      
      await Campground.findByIdAndUpdate(id, data.Campground, { runValidators: true });
      request.status = 'submitted';
      
      await request.save();

      req.flash('success', 'Campground updated successfully');
      return res.redirect(`/host/campgrounds/${id}`);

    } else if (request.type === 'add') {
      const newCamp = new Campground(data.Campground);
      newCamp.host = request.hostId;
      await newCamp.save();

      host.campgrounds = host.campgrounds || [];
      host.campgrounds.push(newCamp._id);
      await host.save();
      req.session.host = host;

      request.status = 'submitted';
      await request.save();

      req.flash('success', 'Campground created successfully');
      return res.redirect('/host/campgrounds');

    } else if (request.type === 'delete') {
      const id = request.campgroundId;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error', 'Invalid campground ID');
        return res.redirect('/host/profile');
      }

      const campground = await Campground.findById(id);
      if (!campground) {
        req.flash('error', 'Campground not found');
        return res.redirect('/host/profile');
      }

      // Delete reviews
      await Review.deleteMany({ _id: { $in: campground.reviews } });

      // Delete trips and associated posts
      const tripsToDelete = await Trip.find({ destination: id });
      const tripIds = tripsToDelete.map(t => t._id);

      for (let trip of tripsToDelete) {
        for (let userId of trip.users) {
          const user = await User.findById(userId);
          if (user) {
            user.trips.pull(trip._id);
            await user.save();
          }
        }
      }

      const posts = await postModel.find({ tripid: { $in: tripIds } });
      for (let post of posts) {
        const user = await User.findById(post.useruploaded);
        if (user) {
          user.posts.pull(post._id);
          await user.save();
        }
      }

      await postModel.deleteMany({ tripid: { $in: tripIds } });
      await Trip.deleteMany({ _id: { $in: tripIds } });

      // Delete campground and remove from host
      await Campground.findByIdAndDelete(id);
      host.campgrounds.pull(id);
      await host.save();
      req.session.host = host;

      request.status = 'submitted';
      await request.save();

      req.flash('success', 'Campground and related data deleted successfully');
      return res.redirect('/host/campgrounds');

    } else {
      req.flash('error', 'Unknown request type');
      return res.redirect('/host/profile');
    }
}));

router.post('/Profile/:requestid/cancel', catchAsync(async (req, res, next) => {

    const requestId = req.params.requestid;
    const hostId = req.session.host._id;

 
    const host = await hostModel.findById(hostId);
    if (!host) {
      req.flash('error', 'Host not found');
      return res.redirect('/host/Profile');
    }

   
    host.requests.pull(requestId);
    await host.save();

    
    await requestModel.findByIdAndDelete(requestId);

    req.flash('success', 'Request cancelled successfully');
    res.redirect('/host/Profile');
}));

router.get('/requests/:requestid',catchAsync(async(req,res)=>{
        const request=await requestModel.findById(req.params.requestid).populate("campgroundId");
        res.render('./request_display.ejs',{request});
}))

router.get('/campgrounds/:id/edit', catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    req.flash('error', 'Invalid Id Format');
    res.redirect('/host/campgrounds');
    return;
  }
  
    const item = await Campground.findById(req.params.id);
    if (!item) {
      req.flash('error', 'Campground Not Found');
      res.redirect('/host/campgrounds');
      return;
    }
    res.render('./host/edit.ejs', { item });
  

}))


module.exports = router;
