//====================================================================================================== REQUIRED MODULES

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const {
  check,
  validationResult
} = require('express-validator');
const passport = require('passport');
const multer = require('multer');

//============================================================================================================================
//====================================================================================================== MULTER SETUP

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toDateString() + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter
});

//============================================================================================================================
//====================================================================================================== REQUIRED MONGOOSE MODELS

let User = require('../models/user');
let Request = require('../models/friend');

//============================================================================================================================
//=========================================================== ROUTE HENGLING ====================================================
//====================================================================================================== REGISTER ROUTES

router.get('/register', (req, res) => {
  res.render('register');
});
router.post('/register', upload.single('profilepicture'), [
  check('name', 'name is required').not().isEmpty(),
  check('email', 'email is required').not().isEmpty(),
  check('email', 'email is invalid').isEmail(),
  check('password', 'password is required').not().isEmpty(),
  check('password', 'password should be atleaest 6 characters long').isLength({
    min: 6
  }),
  check('password', 'password does not match').custom((value, {
    req,
    loc,
    path
  }) => {
    if (value !== req.body.password2) {
      throw new Error('Password does not match');
    } else {
      return value;
    }
  })
], (req, res) => {
  User.find({}, (err, users) => {
    if (err) throw err;

    //============ Checking if typed email matched any taken email

    let matched = users.filter((u) => {
      return req.body.email === u.email;
    });

    //============================ Checking for validation errors

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('register', {
        errors: errors.mapped()
      })
    }
    if (matched.length !== 0) {
      req.flash('danger', 'Email is taken');
      return res.render('register');
    } else {

      //================================= Creating new User

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });

      //================================= Hashing User Password

      bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;

          //================================= Saving User

          newUser.save((err) => {
            if (err) throw err;
            req.flash('success', 'User added');
            res.redirect('/user/login');
          });
        });
      });
    }
  });
});
//============================================================================================================================
//====================================================================================================== LOGIN ROUTES

router.get('/login', (req, res) => {
  res.render('login');
});
router.post('/login', passport.authenticate('local', {session: true}), (req, res, next) => {

  //================================= Checking if typed credentials matches any of the user in database

  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash: true
  })(req,res,next);
});

//================================= Logout Route

router.get('/logout', (req, res) => {
  if (Object.entries(req.session.passport).length === 0) {
    req.flash('success', 'Already Logged Out')
    res.redirect('/user/login');
  } else {
    req.logOut();
    req.flash('success', 'Loged Out');
    res.redirect('/user/login');
  }
});

//======================================================================================================================================
//====================================================================================================== ACCOUNT SETTINGS ROUTES

//============================================================================== GENERAL SETTINGS ROUTE

router.get('/settings/:id', async (req, res) => {
  try {
    const loggedUser = await User.findById(req.params.id);
    const requests = await requestRecieved(loggedUser);
    res.render('generalsettings', {
      loggedUser,
      requests
    })
  } catch (err) {
    throw err;
  }
});


router.post('/settings/:id', [
  check('name', 'Nothing to change').not().isEmpty()
], async (req, res) => {
  try {
    const loggedUser = await User.findById(req.params.id);
    const requests = await requestRecieved(loggedUser);
    let query = {
      _id: req.params.id
    }
    const newname = req.body.name || loggedUser.name;
    const newemail = req.body.email || loggedUser.email;
    let newuser = {
      name: newname,
      email: newemail
    }
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (newname === user.name && newemail === user.email) {
        return res.render('generalsettings', {
          loggedUser,
          requests,
          errors: errors.mapped()
        });
      }
    }
    User.updateOne(query, newuser, (err) => {
      if (err) throw err;
      req.flash('success', 'Updated');
      res.redirect('/');
    });
  } catch (err) {
    throw err;
  }
});

//============================================================================== SECURITY SETTINGS ROUTE

router.get('/securitysettings/:id', async (req, res) => {
  try {
    const loggedUser = await User.findById(req.params.id);
    const requests = await requestRecieved(loggedUser);
    res.render('securitysettings', {
      loggedUser,
      requests
    })
  } catch (err) {
    throw err;
  }
});

router.post('/securitysettings/:id', [
  check('oldpass', 'Please Enter Your Current Password').not().isEmpty(),
  check('newpass', 'Nothing to change').not().isEmpty(),
  check('newpass', 'Password should be atleast 6 characters long').isLength({
    min: 6
  }),
  check('newpass', 'Password does not match').custom((value, {
    req,
    loc,
    path
  }) => {
    if (value !== req.body.repass) {
      throw new Error('Password does not match');
    } else {
      return value;
    }
  })
], async (req, res) => {
  try {
    const loggedUser = await User.findById(req.params.id);
    var query = {
      _id: loggedUser.id
    }
    bcrypt.compare(req.body.oldpass, loggedUser.password, (err, isMatch) => {
      if (err) throw err;
      if (!isMatch) {
        req.flash('danger', 'Wrong Password');
        res.redirect('/');
      } else {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.render('securitysettings', {
            loggedUser,
            errors: errors.mapped()
          });
        }
        let update = {
          password: req.body.newpass
        }
        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(update.password, salt, (err, hash) => {
            if (err) throw err;
            update.password = hash;
            User.updateOne(query, update, (err) => {
              if (err) throw err;
              req.flash('success', 'Updated');
              res.redirect('/');
            })
          })
        })
      }
    });
  } catch (err) {
    throw err;
  }
});

//============================================================================== PROFILE PICTURE SETTING ROUTE

router.post('/account/profilesettings/:id', upload.single('fileupload'), (req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (err) throw err;

    if (req.file == undefined) {
      alert('false image');
      return res.redirect('/');
    }

    var query = {
      _id: req.params.id
    };
    let updated = {
      profilePicture: "\\" + req.file.path
    }
    User.updateOne(query, updated, (err) => {
      if (err) throw err;
      req.flash('success', 'saved')
      res.redirect('/');
    });

  });
});
//===================================  REQUEST HANDELLERS
router.get('/account/:id', async (req, res) => {
  let same = false;
  let isFriends = false;
  let allFriends = [];
  try {
    const user = await User.findById(req.params.id); //== Requested User
    const loggedUser = await userLoggedIn(req, res); //== Logged in User
    //==  Checking if logged in user and requested user are friends or not
    isFriends = loggedUser.friends.includes(user.id);
    //==  Checking if logged in user and requested user are same or not
    if (user.id === loggedUser.id) same = true;
    //==  Checking if logged in user have any requests or not
    const requestsRecieved = await requestRecieved(loggedUser);
    //==  Checking if logged in user has already sent request to requested user
    const requestSent = await Request.find({
      recipent: user.id,
      requestor: loggedUser.id
    });
    if (requestSent.length === 0) {
      //==  Checking if requested user has already sent request to logged in user    
      const userRequest = await Request.find({
        requestor: user.id,
        recipent: loggedUser.id
      });
      if (userRequest.length !== 0) {
        // let requestorID = mongoose.Types.ObjectId(request[0].recipent);
        // let alreadySent = requestorID.equals(loggeduser.id);
        let alreadySent = true;
        res.render('account', {
          user,
          loggedUser,
          isFriends,
          requests: userRequest,
          alreadySent,
          same
        });
      } else {
        res.render('account', {
          user,
          loggedUser,
          isFriends,
          same,
          requests: requestsRecieved
        });
      }
    } else {
      res.render('account', {
        user,
        loggedUser,
        isFriends,
        requests: requestsRecieved,
        same,
        isSent: requestSent
      });
    }
  } catch (err) {
    throw err;
  }

});
//===================================  SENT REQUEST
router.post('/account/:id', (req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (err) throw err;
    User.findById(req.session.passport.user, (err, loggeduser) => {
      if (err) throw err;
      var request = new Request({
        requestorName: loggeduser.name,
        requestor: loggeduser.id,
        recipentName: user.name,
        recipent: user.id,
        status: 1
      });
      request.save((err) => {
        if (err) throw err;
        req.flash('success', 'Request Sent');
        res.redirect('back');
      });
    })
  })
});
//===================================  ACCEPTED REQUEST
router.get('/request/accepted/:id', (req, res) => {
  Request.findById(req.params.id, (err, request) => {
    if (err) throw err;
    let query = {
      _id: req.params.id
    };
    let statusChange = {
      status: 2
    }
    Request.updateOne(query, statusChange, (err) => {
      if (err) throw err;
      req.flash("success", "Now your'e friends with " + request.requestorName);
      res.redirect('/');
    })
  });
});
//===================================  REJECTED REQUEST
router.get('/request/rejected/:id', (req, res) => {
  Request.findById(req.params.id, (err, request) => {
    if (err) throw err;
    let query = {
      _id: req.params.id
    };
    // let statusChange = {
    //   status: 3
    // }
    // Request.updateOne(query, statusChange, (err) => {
    //   if(err) throw err;
    //   req.redirect
    // })
    Request.deleteOne(query, (err) => {
      if (err) throw err;
      res.redirect('back');
    })
  })
});
//===================================  CANCEL REQUEST
router.get('/request/cancelled/:id', (req, res) => {
  Request.findById(req.params.id, (err, request) => {
    if (err) throw err;
    let query = {
      _id: request._id
    };
    Request.deleteOne(query, (err) => {
      if (err) throw err;
      req.flash('danger', 'Cancelled Request')
      res.redirect('back');
    })
  });
});
//===================================  ACCOUNT DELETION
router.get('/account/deletion/:id', (req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (err) throw err;
    res.render('end', {
      cur_user: user
    })
  })
})
router.post('/account/deletion/:id', (req, res) => {
  let query = {
    _id: req.params.id
  };
  User.deleteOne(query, (err) => {
    if (err) throw err;
    res.redirect('/');
  })
})
// == Function for logged in user
async function userLoggedIn(req, res) {
  if (req.session.passport !== undefined) {
    const loggedUser = await User.findById(req.session.passport.user);
    return loggedUser;
  } else {
    req.flash('Login First');
    res.redirect('login');
  }
}
// == Function to check requests
async function requestRecieved(loggedUser) {
  const requests = await Request.find({
    recipent: loggedUser.id
  });
  return requests;
}
module.exports = router;