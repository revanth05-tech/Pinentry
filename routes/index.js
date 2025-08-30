var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

router.get('/profile', isLoggedIn, (req, res) => {
  res.send("Profile Page ✅ You are logged in!");
});

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

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

module.exports = router;
