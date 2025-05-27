
require('dotenv').config();
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
const Trip = require("../Models/trip.js");
const AppError = require("../AppError.js");
const catchAsync = require("../catchAsync.js");
const { storage } = require('../cloudinary/index.js');
const multer = require("multer");
const upload = multer({ storage });

const nodemailer = require('nodemailer');

router.use(express.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.get('/forgot', (req, res) => {
    res.render('./users/forgot-password.ejs', { step: 'email' });
});

router.post('/forgot', catchAsync(async (req, res) => {
    const { email, username } = req.body;
    const getuser = await User.findOne({ username: username, email: email });
    if (!getuser) {
        req.flash('error', 'Invalid Username or Email');
        return res.redirect('/Users/forgot');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    req.session.otp = otp;
    req.session.email = email;
    req.session.resettingusername = username;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Password Reset',
        text: `   
Hi ${username},

Sorry to hear you’re having trouble logging into Yelpcamp. We got a message that you forgot your password. If this was you, you can get right back into your account.Your OTP code is: ${otp}`,
    });


    res.render('./users/forgot-password.ejs', { step: 'otp', email });

}));

router.post('/verifyotp', (req, res) => {
    if (!req.session.resettingusername) {
        return res.redirect('/Users/forgot');
    }
    const { otp } = req.body;

    if (otp === req.session.otp) {

        req.session.otp = null;
        res.render('./users/forgot-password.ejs', { step: 'success' });
    } else {
        res.render('./users/forgot-password.ejs', { step: 'error', email: req.session.email });
    }
});

router.post('/resetpassword', catchAsync(async (req, res) => {
    if (!req.session.resettingusername) {
        return res.redirect('/Users/forgot');
    }

    const { newpassword, confirmpassword } = req.body.user;
    if (newpassword != confirmpassword) {
        return res.render('./users/forgot-password.ejs', { step: 'success', error: 'Confirm your password correctly' });
    }
    const user = await User.findOne({ username: req.session.resettingusername });
    user.password = newpassword;
    await user.save();
    req.session.user = user;
    req.flash('success', 'Password reset Successfully');
    res.redirect('/campgrounds');
}))


const validateUser = (req, res, next) => {
    const us = req.body.user.username;
    const pw = req.body.user.password;
    const email = req.body.user.email;
    const curr = {
        user: {
            username: us,
            password: pw,
            email: email
        }
    }
    const { error } = UserSchema.validate(curr);
    let msg;
    if (error) {
        msg = error.details.map(el => el.message).join(',');


        if (req.originalUrl.includes('Register')) {
            req.flash('error', msg);
            return res.redirect('/Users/Register');
        } else if (req.originalUrl.includes('login')) {
            if (msg == 'Email is required.') {
                return next();
            }
            req.flash('error', "Invalid Username or Password");
            return res.redirect('/Users/login');
        } else {
           
            return res.redirect('/');
        }
    } else {
        next();
    }
}
 

//middle ware
router.use(catchAsync(async (req, res, next) => {
    res.locals.curr = true;
    res.locals.following = false;
    const profileMatch = req.path.match(/^\/Profile\/([^\/]+)/);
    let targetUsername = profileMatch ? profileMatch[1] : null;
    let currentUsername = req.session.user ? req.session.user.username : null;
    res.locals.user = await User.findOne({ username: targetUsername });
    const targetUser = await User.findOne({ username: targetUsername });
    const currentUser = await User.findOne({ username: currentUsername });
    res.locals.targetUser = targetUser;
    res.locals.currentUser = currentUser;

    res.locals.currentUsername = currentUsername;
    

    res.locals.targetUsername = targetUsername;
    if (targetUsername && currentUsername) {
        res.locals.curr = targetUsername === currentUsername;

        if (!res.locals.curr) {
            try {
                if (targetUser && currentUser) {
                    res.locals.following = targetUser.followers.some(followerId =>
                        followerId.toString() === currentUser._id.toString()
                    );
                }
            } catch (err) {
                console.error('Error in global middleware:', err);
            }
        }
    }

    next();
}));

//apis
router.get('/search', catchAsync(async (req, res) => {
    const searchTerm = req.query.searchTerm || '';
    if (!searchTerm) return res.json([]);


    const users = await User.find({
        username: { $regex: `^${searchTerm}`, $options: 'i' }
    }).select('username'); // only return usernames

    res.json(users);

}));

router.get('/Profile/:username/following/search', catchAsync(async (req, res) => {

    const username = req.params.username;
    const searchTerm = req.query.searchTerm?.trim() || "";

    // Find the user and populate their following list
    const user = await User.findOne({ username }).populate('following');

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // If searchTerm is empty, return all followings
    if (!searchTerm) {
        return res.json(user.following);
    }

    // Case-insensitive prefix match filtering
    const filteredFollowings = user.following.filter(followedUser =>
        followedUser.username.toLowerCase().startsWith(searchTerm.toLowerCase())
    );

    return res.json(filteredFollowings);
}));

router.get('/Profile/:username/follow/search', catchAsync(async (req, res) => {

    const username = req.params.username;
    const searchTerm = req.query.searchTerm?.trim() || "";

    // Find the user and populate their following list
    const user = await User.findOne({ username }).populate('followers');

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // If searchTerm is empty, return all followings
    if (!searchTerm) {
        return res.json(user.followers);
    }

    // Case-insensitive prefix match filtering
    const filteredFollowers = user.followers.filter(followerUser =>
        followerUser.username.toLowerCase().startsWith(searchTerm.toLowerCase())
    );

    return res.json(filteredFollowers);
}));

router.get('/check', catchAsync(async (req, res) => {
    const { username } = req.query;

    if (!req.session.user.username) {

        return res.json({ exists: false });
    }

    if (!username) {

        return res.json({ exists: false, message: 'No username provided' });
    }
    if (req.session.user.username === username) { return res.json({ exists: true }); }


    const targetUser = await User.findOne({ username: username.trim() });
    const currentUser = await User.findOne({ username: req.session.user.username.trim() });

    if (!targetUser || !currentUser) {

        return res.json({ exists: false, message: 'User not found' });
    }

    const isFollower = targetUser.followers.some(followerId =>
        followerId.toString() === currentUser._id.toString()
    );

    return res.json({ exists: isFollower });

}));

router.get('/login', (req, res) => {
    res.render('./users/login.ejs', { dest: 'login' });
})

router.post('/login', validateUser, catchAsync(async (req, res) => {
    const user = req.body.user;
    const { username, password } = user;
    const isvalid = await User.findByUsernameAndValidate({ username, password });
    if (isvalid) {
        req.session.user = isvalid;
        req.flash('success', 'LoggedIn Successfully');
        res.redirect('/campgrounds');
        return;
    } else {
        req.flash('error', 'Invalid Username or Password');
        res.redirect('/Users/login');
    }
}))

router.get('/Register', (req, res) => {
    res.render('./users/login.ejs', { dest: 'Register' });
})

router.post('/Register', validateUser, catchAsync(async (req, res) => {

    const exist = await User.findOne({ username: req.body.user.username });
    if (exist) {
        req.flash('error', 'username is already taken');
        return res.redirect('/Users/Register');
    }

    const u = req.body.user;
    if (u.password != u.confirmpassword) {
        req.flash('error', 'Confirm password Correctly');
        return res.redirect('/Users/Register');
    }
    const us = req.body.user.username;
    const pw = req.body.user.password;
    const em = req.body.user.email;
    const user = new User({ username: us, password: pw, email: em });
    delete user.posts; 
    delete user.following;
    delete user.followers;
    user.enrolled = Date.now();
    user.posts = [];  
    user.followers = [];
    user.following = [];
    await user.save();
    req.flash('success', 'Registered Successfully');
    res.redirect('/Users/login');

}));

//for checking authentication
router.use((req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'You are not authenticated');
        return res.redirect('/');
    }
    next();
})


router.get('/Profile/:username', catchAsync(async (req, res) => {

    if (!req.session.user) {
        req.flash('error', 'Please login to access Profiles');
        return res.redirect('/Users/login');
    }


    let user;
    let Frnduser = null;
    let commontrips = [];
    let friend = false;

    // Viewing own profile
    if (req.params.username === req.session.user.username) {
        user = await User.findOne({ username: req.params.username })
            .populate({
                path: 'trips',
                populate: [
                    { path: 'destination' },
                    { path: 'users', select: 'username' }
                ]
            });

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/');
        }

        return res.render('./users/profile.ejs', {
            user,
            curr: true
        });
    }

    // Viewing a friend's profile
    Frnduser = await User.findOne({ username: req.params.username })
        .populate({
            path: 'trips',
            populate: [
                { path: 'destination' },
                { path: 'users', select: 'username' }
            ]
        });

    user = await User.findOne({ username: req.session.user.username })
        .populate({
            path: 'trips',
            populate: [
                { path: 'destination' },
                { path: 'users', select: 'username' }
            ]
        });

    if (!user || !Frnduser) {
        req.flash('error', 'User not found');
        return res.redirect('/');
    }

    // Find common trips
    const friendTripIds = new Set(Frnduser.trips.map(trip => trip._id.toString()));
    commontrips = user.trips.filter(trip => friendTripIds.has(trip._id.toString()));

    // Check if current user is following the friend
    for (let each of user.following) {
        if (each.toString() === Frnduser._id.toString()) {
            friend = true;
            break;
        }
    }

    res.render('./users/profile.ejs', {
        user: Frnduser,
        curr: false,
        commontrips,
        friend
    });

}));


router.get('/Logout', (req, res) => {
    for (let key in req.session) {
        if (key !== 'cookie') {
            delete req.session[key];
        }
    }
    req.flash('success', 'LoggedOut Successfully');
    res.redirect('/');
})


router.get('/Profile/:username/settings', (req, res) => {
    if (!req.session.user || req.session.user.username != req.params.username) {
        req.flash('error', 'You are not authorized to do this');
        return res.redirect('/Users/login');
    }

    res.render('./users/settings.ejs');
})

router.post('/Profile/:username', upload.single('user[profilepic]'), catchAsync(async (req, res) => {
    if (!req.session.user.username || req.session.user.username != req.params.username) {
        req.flash('error', 'Please Login into your account');
        return res.redirect('Users/login');
    }
    const { newusername, oldpassword, confirmpassword, email } = req.body.user;


    const exist = await User.findOne({ username: newusername });
    if (exist && req.params.username != newusername) {
        req.flash('error', 'username is already taken');
        return res.redirect(`/Users/Profile/${req.session.user.username}/settings`);
    }

    const username = req.params.username;
    const { newpassword } = req.body.user;
    const result = await User.findByUsernameAndValidate({ username, password: oldpassword });
    if (!result) {
        req.flash('error', 'Incorrect Password');
        return res.redirect(`/Users/Profile/${req.session.user.username}/settings`);
    }

    if (newpassword !== confirmpassword) {
        req.flash('error', 'Confirm new password correctly');
        return res.redirect(`/Users/Profile/${req.params.username}/settings`);
    }

    const user = await User.findOne({ username: username });
    if (newpassword) {
        user.password = newpassword;
    }

    if (email) {
        user.email = email;
    }
    if (req.file) { user.profilepic = req.file.path; console.log(req.file.path); }
    if (req.body.removal == 'on') {
        user.profilepic = User.schema.path('profilepic').defaultValue;
    }
    console.log(req.body);
    user.username = newusername;
    await user.save();
    req.session.user = user;
    req.flash('success', 'Profile Updated Successfully');
    res.redirect(`/Users/Profile/${newusername}`);

}))

router.get('/Profile/:username/:tripid/upload', (req, res) => {
    if (!req.session.user.username || req.session.user.username != req.params.username) {
        req.flash('error', 'Please Login into your account');
        return res.redirect('Users/login');
    }
    res.render('./users/upload.ejs', { tripid: req.params.tripid });
})

router.post('/Profile/:username/:tripid/upload', upload.array('images'), catchAsync(async (req, res) => {
    if (!req.session.user.username || req.session.user.username != req.params.username) {
        req.flash('error', 'Please Login into your account');
        return res.redirect('Users/login');
    }
    const { username, tripid } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('back');
    }

    const newPost = new postModel({
        tripid: tripid,
        date: new Date(), 
        useruploaded: user._id,
        images: req.files.map((e) => { return e.path; }),
        description: req.body.description
    });

    await newPost.save();

    user.posts.push(newPost);
    await user.save();
    req.flash('success', 'Uploaded Successfully');
    res.redirect(`/Users/Profile/${username}`);

}));


router.get('/Profile/:username/posts', catchAsync(async (req, res) => {
    if (!res.locals.curr && !res.locals.following) {
        req.flash('error', 'Please Login into your account');
        return res.redirect('/Users/login');
    }

    const user = await User.findOne({ username: req.params.username }).populate({
        path: 'posts',
        populate: {
            path: 'tripid',
            populate: {
                path: 'destination'  
            }
        }
    });

    if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('back');
    }
    const posts = user.posts;
    res.render('./users/posts.ejs', { posts });

}));

router.get('/Profile/:username/follow', catchAsync(async (req, res) => {
    if (!req.session.user.username) {
        req.flash('error', 'Please Login into your account');
        return res.redirect('/Users/login');
    }

    const user = await User.findOne({ username: req.session.user.username });
    const frnd = await User.findOne({ username: req.params.username });
    user.following.push(frnd._id);
    frnd.followers.push(user._id);
    await user.save();
    await frnd.save();
    req.flash('success', `Followed ${frnd.username} Succesfully`);
    res.redirect(`/Users/Profile/${req.params.username}`);
}))

router.get('/Profile/:username/unfollow', catchAsync(async (req, res) => {
    if (!req.session.user.username) {
        req.flash('error', 'Please login to your account');
        return res.redirect('/Users/login');
    }

    const user = await User.findOne({ username: req.session.user.username });
    const frnd = await User.findOne({ username: req.params.username });

    if (!user || !frnd) {
        req.flash('error', 'User not found');
        return res.redirect('/');
    }

    // Remove friend's ID from current user's following list
    user.following.pull(frnd._id);

    // Remove current user's ID from friend's followers list
    frnd.followers.pull(user._id);

    await user.save();
    await frnd.save();

    req.flash('success', `Unfollowed ${frnd.username} Succesfully`);
    res.redirect(`/Users/Profile/${user.username}/following`);

}));

router.get('/Profile/:username/remove', catchAsync(async (req, res) => {
    if (!req.session.user.username) {
        req.flash('error', 'Please login to your account');
        return res.redirect('/Users/login');
    }

    const user = await User.findOne({ username: req.session.user.username });
    const frnd = await User.findOne({ username: req.params.username });

    if (!user || !frnd) {
        req.flash('error', 'User not found');
        return res.redirect('/');
    }

    // Remove friend's ID from current user's following list
    frnd.following.pull(user._id);

    // Remove current user's ID from friend's followers list
    user.followers.pull(frnd._id);

    await user.save();
    await frnd.save();

    req.flash('success', `Removed ${frnd.username} Succesfully`);
    res.redirect(`/Users/Profile/${user.username}/followers`);


}));

router.put('/Profile/:username/unfollow', catchAsync(async (req, res) => {
    if (!req.session.user.username) {
        req.flash('error', 'Please login to your account');
        return res.redirect('/Users/login');
    }

    const user = await User.findOne({ username: req.session.user.username });
    const frnd = await User.findOne({ username: req.params.username });

    if (!user || !frnd) {
        req.flash('error', 'User not found');
        return res.redirect('/');
    }

    // Remove friend's ID from current user's following list
    user.following.pull(frnd._id);

    // Remove current user's ID from friend's followers list
    frnd.followers.pull(user._id);

    await user.save();
    await frnd.save();

    req.flash('success', `Unfollowed ${frnd.username} Succesfully`);
    res.redirect(`/Users/Profile/${frnd.username}`);

}));

router.get('/Profile/:username/followers', catchAsync(async (req, res) => {
    if (res.locals.curr == false && res.locals.following == false) {
        req.flash('error', 'Unauthorized');
        res.redirect('/Users/Profile/login');
        return;
    }
    const user = await User.findOne({ username: req.params.username }).populate('followers');
    const followers = user.followers;
    res.render('./users/followers.ejs', { followers });
}));

router.get('/Profile/:username/following', catchAsync(async (req, res) => {
    if (res.locals.curr == false && res.locals.following == false) {
        req.flash('error', 'Unauthorized');
        res.redirect('/Users/Profile/login');
        return;
    }
    const user = await User.findOne({ username: req.params.username }).populate('following');
    const followings = user.following;
    res.render('./users/following.ejs', { followings });
}));

router.post('/:username/report',catchAsync(async(req,res)=>{
      const user=await User.findOne({username:req.params.username});
      user.reported=true;
      await user.save();
      req.flash('success','Reported User Successfully');
      res.redirect(`/Users/Profile/${req.params.username}`);
}))

router.delete('/Profile/:username', catchAsync(async (req, res, next) => {

    if (req.session.user.username !== req.params.username) {
        return next(new AppError(400, "You are not authenticated to delete this account."));
    }

    const user = await User.findOne({ username: req.params.username });

    if (!user) {
        return next(new AppError(404, "User not found."));
    }
    const password = req.body.password;

    const result = await User.findByUsernameAndValidate({ username: req.params.username, password });
    if (!result) {
        req.flash('error', 'Incorrect Password');
        return res.redirect(`/Userss/Profile/${req.params.username}/settings`);
    }

    // 1. Delete all posts uploaded by user & remove references from user's posts
    for (let postId of user.posts) {
        await postModel.findByIdAndDelete(postId);
    }

    // 2. Remove user from trips
    for (let tripId of user.trips) {
        const t = await Trip.findById(tripId);
        if (t) {
            t.users.pull(user._id);
            if (t.users.length == 0) { await Trip.findByIdAndDelete(tripId); }
            else { await t.save(); }
        }
    }

    // 3. Delete reviews by user
    const deletedReviews = await Review.find({ author: user._id });
    const deletedReviewIds = deletedReviews.map(r => r._id);

    // 1. Delete the reviews
    await Review.deleteMany({ author: user._id });

    // 2. Find all campgrounds that referenced these reviews
    const campsToUpdate = await Campground.find({ reviews: { $in: deletedReviewIds } });

    for (let camp of campsToUpdate) {
        // 3. Remove deleted review IDs
       for(let each of deletedReviewIds){
          camp.reviews.pull(each);
       }

        // 4. Recalculate rating
        let sum = 0;
        for (let reviewId of camp.reviews) {
            const review = await Review.findById(reviewId);
            sum += review?.rating || 0;
        }

        camp.rating = camp.reviews.length > 0
            ? Number((sum / camp.reviews.length).toFixed(2))
            : 0;

        await camp.save();
    }


    // 4. Remove this user from other users’ followers/following
    for (let followerId of user.followers) {
        const u = await User.findById(followerId);
        if (u) {
            u.following.pull(user._id);
            await u.save();
        }
    }

    for (let followingId of user.following) {
        const u = await User.findById(followingId);
        if (u) {
            u.followers.pull(user._id);
            await u.save();
        }
    }

    // 5. Finally, delete the user
    await User.findByIdAndDelete(user._id);

    // 6. Clear session
    for (let key in req.session) {
        if (key !== 'cookie') {
            delete req.session[key];
        }
    }

    req.flash('success', 'Account deleted successfully.');
    res.redirect('/');

}));


router.delete('/Profile/:username/posts/:postid', catchAsync(async (req, res, next) => {
    if (req.session.user.username != req.params.username) {
        return next(new AppError(400, "You are not Authenticated"));
    }
    await postModel.findByIdAndDelete({ _id: req.params.postid });
    const user = await User.findOne({ username: req.params.username });
    user.posts.pull(req.params.postid);
    user.save();
    req.flash('success', 'Post Deleted Successfully');
    res.redirect(`/Users/Profile/${req.params.username}/posts`);

}))

router.delete('/Profile/:username/:tripid', catchAsync(async (req, res) => {
    const { username, tripid } = req.params;

    const trip = await Trip.findById(tripid);
    if (!trip) {
        req.flash('error', 'Trip not found');
        return res.redirect(`/Users/Profile/${username}`);
    }

    // Remove trip from each user's trips array
    const allusers = trip.users;
    for (let each of allusers) {
        const user = await User.findById(each);
        if (user) {
            user.trips.pull(tripid);
            await user.save();
        }
    }

    // Delete all posts related to the trip and remove from user.posts
    const allposts = await postModel.find({ tripid });
    for (let each of allposts) {
        const user = await User.findById(each.useruploaded);
        if (user) {
            user.posts.pull(each._id);
            await user.save();
        }
        await postModel.findByIdAndDelete(each._id);
    }

    // Delete the trip itself
    await Trip.findByIdAndDelete(tripid);

    req.flash('success', 'Trip Cancelled Successfully. Your money will be returned in 2 business days.');
    res.redirect(`/Users/Profile/${username}`);

})); 

router.post('/Profile/:username/posts/:postid/report',catchAsync(async(req,res)=>{
       const post=await postModel.findById(req.params.postid);
       post.reported=true;
       await post.save();
       req.flash('success','Reported Post Successfully');
       res.redirect(`/Users/Profile/${req.params.username}/posts`);
}))



module.exports = router;

