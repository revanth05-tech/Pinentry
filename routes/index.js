var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const upload = require('./multer');

// Middleware
router.use(flash());
passport.use(new localStrategy(userModel.authenticate()));

// Home route
router.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

// Login page
router.get('/login', (req, res) => {
  const errorMsg = req.flash('error')[0] || "";
  res.render('login', { error: errorMsg });
});

// Feed page (protected)
router.get('/feed', isLoggedIn, (req, res) => {
  res.render('feed', { title: 'Feed' });
});

// Upload new post
router.post('/upload', isLoggedIn, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('⚠️ No files were uploaded');
    }

    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send("❌ User not found");
    }

    const newPost = await postModel.create({
      image: req.file.filename,
      imageText: req.body.filecaption,
      user: user._id
    });

    // Save post reference in user
    user.posts.push(newPost._id);
    await user.save();

    // ✅ Redirect to profile instead of just sending text
    res.redirect('/profile');
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).send("❌ Something went wrong while uploading.");
  }
});

// Forgot password
router.get('/forgot', (req, res) => {
  res.send("Do you want a reminder for your password❓");
});

// Profile (protected)
router.get('/profile', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findOne({ username: req.session.passport.user })
      .populate("posts"); // ✅ get full post details

    if (!user) {
      return res.status(404).send("❌ User not found");
    }

    res.render('profile', { 
      title: 'Profile',
      user: user,
      boards: [],          // placeholder
      pins: user.posts     // ✅ actual posts
    });

    console.log("User with posts:", user);
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).send("❌ Error loading profile");
  }
});

// Register new user
router.post('/register', (req, res) => {
  const { username, email, fullName, password } = req.body;

  if (!username || !email || !fullName || !password) {
    return res.status(400).send("⚠️ All fields are required!");
  }

  userModel.register(new userModel({ username, email, fullName }), password)
    .then(user => {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/profile");
      });
    })
    .catch(err => {
      if (err.code === 11000) {
        res.status(400).send("⚠️ Username or Email already exists!");
      } else {
        res.status(400).send("❌ Something went wrong: " + err.message);
      }
    });
});

// Login post
router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

// Middleware to check authentication
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

module.exports = router;
