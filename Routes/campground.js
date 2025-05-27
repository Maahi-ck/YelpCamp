

const mongoose = require("mongoose");
const Host = require('../Models/host.js');
const express = require('express');
const router = express.Router();
const Campground = require('../Models/campground.js');
const hostModel = require('../Models/host.js');
const requestModel = require("../Models/request.js");
const postModel = require("../Models/post.js");
const Review = require("../Models/review.js");
const User = require("../Models/user.js");
const { ReviewSchema, CampgroundSchema, HostSchema, UserSchema } = require("../schemas.js");
const Trip=require("../Models/trip.js");
const AppError=require("../AppError.js");
const catchAsync=require("../catchAsync.js");


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


//apis

router.get('/all', catchAsync(async (req, res) => {
  const allCampgrounds = await Campground.find({});
  res.json(allCampgrounds);
}));
 
router.get('/search', catchAsync(async (req, res) => {

  const searchTerm = req.query.searchTerm || '';
    const getall = await Campground.find({
      title: { $regex: searchTerm, $options: 'i' } // case-insensitive search
    });

    res.send(getall);

}));

//---------------------------------------------------------------------

router.get('/', catchAsync(async (req, res, next) => {

    const data = await Campground.find({});
    res.render('./campgrounds/index.ejs', { data });

}))

router.get('/:id', catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash('error', 'Invalid Id Format');
    return res.redirect('/campgrounds');
  }

    const data = await Campground.findById(id).populate({
      path: 'reviews',
      populate: { path: 'author' }
    });

    if (!data) {
      req.flash('error', 'Campground Not Found');
      return res.redirect('/campgrounds');
    }
       let username = null;
    if(req.session.user){
         username=req.session.user.username;
    }

    res.render('./campgrounds/show.ejs', { data, username });
 
}));

//user must be logged in for these


router.use((req, res, next) => {
        if (!req.session.user) {
          req.flash('error', 'You are not authenticated');
          res.redirect(`/campgrounds`);
          return;
        }
        next();
})


router.get('/:id/book', catchAsync(async (req, res) => {
  const camp = await Campground.findOne({ _id: req.params.id });
  if (!camp) {
    req.flash('error', 'Campground Not Found');
    res.render('/campgrounds');
  }
  res.render('./campgrounds/book.ejs', { camp });
}))


//--
const PDFDocument = require('pdfkit');
const axios = require('axios');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const campground = require("../Models/campground.js");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Helper to download image from URL and return buffer
async function downloadImageBuffer(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.error('Error downloading image:', url, error.message);
    return null; // skip if fail
  }
}
 


async function generateTripPDF(trip, users, camp, campImageBuffers = []) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Header
    doc
      .fillColor('#1f4e79')
      .fontSize(26)
      .text('Yelpcamp Trip Booking Confirmation', { align: 'center' })
      .moveDown();

    doc
      .fontSize(14)
      .fillColor('#000')
      .text(`Thank you for booking with Yelpcamp!`, { align: 'center' })
      .moveDown(1.5);

    // Trip Details
    doc
      .fontSize(12)
      .fillColor('#1f4e79')
      .text('Trip Summary', { underline: true })
      .moveDown(0.5)
      .fillColor('#000');

    doc.text(`Destination: ${camp.title}`, { indent: 20 });
    doc.text(`Location: ${camp.location}`, { indent: 20 });
    doc.text(`Days: ${trip.days}`, { indent: 20 });
    doc.text(`Price Per Day: ₹${camp.price}`, { indent: 20 });
    doc.text(`Total Price: ₹${trip.price}`, { indent: 20 });
    doc.moveDown(1.5);

    // Participants
    doc
      .fillColor('#1f4e79')
      .fontSize(12)
      .text('Participants', { underline: true })
      .moveDown(0.5)
      .fillColor('#000');

    users.forEach((u, i) => {
      doc.text(`${i + 1}. ${u.username}`, { indent: 20 });
    });

    // Add images on new page if available
    if (campImageBuffers.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor('#1f4e79').text('Campground Images', { align: 'center' });
      doc.moveDown();

      const maxWidth = 400;
      const maxHeight = 250;
      let y = doc.y;

      campImageBuffers.forEach((imgBuffer, idx) => {
        if (!imgBuffer) return;

        try {
          doc.image(imgBuffer, {
            fit: [maxWidth, maxHeight],
            align: 'center',
            valign: 'center',
            y: y,
          });

          doc
            .fontSize(10)
            .fillColor('#444')
            .text(`Image ${idx + 1}`, { align: 'center' });

          y += maxHeight + 60;

          if (y + maxHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            y = doc.y;
          }
        } catch (err) {
          console.error('Error embedding image:', err);
        }
      });
    }

    // Footer
    doc
      .moveDown(2)
      .fontSize(10)
      .fillColor('#777')
      .text('For support or changes, contact us at support@yelpcamp.com', { align: 'center' });

    doc.end();
  });
}


router.post('/:id/book', catchAsync(async (req, res) => {
  const camp = await Campground.findById(req.params.id);
  if (!camp) {
    req.flash('error', 'Campground Not Found');
    return res.redirect('/campgrounds');
  }

  const tripData = req.body.trip;

  
  const userDocs = await User.find({ username: { $in: tripData.users } });


  if (userDocs.length !== tripData.users.length) {
    req.flash('error', 'One or more participants not found');
    return res.redirect(`/campgrounds/${req.params.id}`);
  }


  tripData.users = userDocs.map(user => user._id);
  tripData.destination = camp._id;
  tripData.price = camp.price * tripData.days;

  const trip = new Trip(tripData);
  await trip.save();


  for (const user of userDocs) {
    user.trips.push(trip._id);
    await user.save();
  }

  
  let campImageBuffers = [];
  if (camp.images && camp.images.length > 0) {
    campImageBuffers = await Promise.all(camp.images.map(url => downloadImageBuffer(url)));
  }


  const pdfBuffer = await generateTripPDF(trip, userDocs, camp, campImageBuffers);

  


  for(let each of trip.users){
      let curruser= (await User.findById(each));
      let userEmail=curruser.email;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Your Yelpcamp Trip Booking Confirmation',
    text: `Hi ${curruser.username},\n\nYour trip to ${camp.title} has been booked successfully! Please find the trip details attached.\n\nThank you for choosing Yelpcamp!`,
    attachments: [
      {
        filename: 'TripBookingConfirmation.pdf',
        content: pdfBuffer,
      },
    ],
  });

}

  req.flash('success', 'Trip booked successfully! Confirmation email sent.');
  res.redirect(`/Users/Profile/${req.session.user.username}`);
}));

//--


router.post('/:id/reviews', validateReview, catchAsync(async (req, res, next) => {
  const item = req.body.Review;
  const camp = await Campground.findById(req.params.id).populate('reviews');
  if (!camp) {
    return next(new AppError(400, "Campground Not Found"));
  }

  item.campground = req.params.id;
  item.author = (await User.findOne({ username: req.session.user.username }))._id;

  const review = new Review(item);
  await review.save();

  camp.reviews.push(review._id);


  let sum = 0;
  for (let each of camp.reviews) {
    const reviewDoc = await Review.findById(each); 
    sum += reviewDoc?.rating || 0;
  }

  camp.rating = camp.reviews.length > 0 ? Number((sum / camp.reviews.length).toFixed(2)) : 0;

  await camp.save();
  req.flash('success', 'Added New Review Successfully');
  res.redirect(`/campgrounds/${req.params.id}`);
}));


router.delete('/:id/reviews/:rid', catchAsync(async (req, res, next) => {
  const { id, rid } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(rid)) {
    return next(new AppError(400, 'Invalid ID format'));
  }

  await Review.findByIdAndDelete(rid);

  const camp = await Campground.findById(id).populate('reviews');
  if (!camp) {
    return next(new AppError(400, 'Campground Not Found'));
  }

  camp.reviews.pull(rid);

 
  let sum = 0;
  for (let each of camp.reviews) {
    const reviewDoc = await Review.findById(each); 
    sum += reviewDoc?.rating || 0;
  }

  camp.rating = camp.reviews.length > 0 ? Number((sum / camp.reviews.length).toFixed(2)) : 0;

  await camp.save();
  req.flash('success', 'Review deleted successfully');
  res.redirect(`/campgrounds/${id}`);
}));



module.exports = router;

