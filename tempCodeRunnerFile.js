require('dotenv').config();
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken=process.env.MAPBOX_TOKEN;
const geocoder=mbxGeocoding({accessToken:mapBoxToken});
const helmet=require("helmet");
const mongoose = require("mongoose");
const mongoSanitize=require("express-mongo-sanitize");

const url =process.env.MONGO_URL;
mongoose.connect(url, { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB:", mongoose.connection.name))
  .catch(err => console.error("MongoDB connection error:", err));


mongoose.set('strictQuery', true);
mongoose.connection.once('open', () => {
  console.log("connected");

})


const path = require("path");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.use(
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(`This request[${key}] is sanitized`);
    },
    replaceWith: '_'
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, '/public')));
const ejsMate = require("ejs-mate");
app.engine('ejs', ejsMate);
const AppError = require("./AppError.js");
const userRoute = require('./Routes/user.js');
const adminRoute = require('./Routes/admin.js');
const hostRoute = require('./Routes/host.js');
const campgroundRoute = require('./Routes/campground.js');


const Review = require('./Models/review.js');
const Campground = require('./Models/campground.js');
const User = require('./Models/user.js');
const Trip = require('./Models/trip.js');
const postModel = require('./Models/post.js');
const hostModel = require('./Models/host.js');
const request = require('./Models/request.js');
const { ReviewSchema, CampgroundSchema, UserSchema } = require('./schemas.js');
const catchAsync = require("./catchAsync.js");

const flashMiddleWare = require('connect-flash');
const adminModel = require('./Models/admin.js');
const { hostname } = require('os');
const { contentSecurityPolicy } = require('helmet');

const session = require('express-session');
const MongoDBStore= require("connect-mongo");
const store = MongoDBStore.create({
  mongoUrl: url,
  crypto: {
    secret: "thisshouldbeasecret"
  },
  touchAfter: 24 * 60 * 60 // seconds
});
const sessionConfig = {
  store,
  secret: "thisismysecret", resave: false, saveUninitialized: false,
  cookie: {
     httppOnly:true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
};
app.use(session(sessionConfig));
app.use(flashMiddleWare());
app.use(helmet({contentSecurityPolicy:false}));



app.use((req, res, next) => {
  res.locals.success = req.flash('success')[0];
  res.locals.error = req.flash('error')[0];
  res.locals.req = req;
  
  next();
})



app.get('/', catchAsync(async (req, res, next) => {
  res.render('Home.ejs');
}))




app.use('/Users', userRoute);
app.use('/admin', adminRoute);
app.use('/host', hostRoute);
app.use('/campgrounds', campgroundRoute);



 
app.all(/(.*)/, (req, res) => {

  const err = new AppError();
  err.message = "The requested URL is not present on this server";
  res.render('ErrorPage.ejs', { err });
})


app.use((err, req, res, next) => {
  
  res.render('ErrorPage.ejs', { err })
})









