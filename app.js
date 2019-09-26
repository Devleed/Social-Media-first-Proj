const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const passport = require("passport");
const multer = require("multer");
const config = require("./config/database");
const messages = require("express-messages");
const passportConfig = require("./config/passport");
const socket = require("socket.io");
const Fuse = require("fuse.js");
/*--------- Requiring Models ------------*/
const Post = require("./models/Posts");
const User = require("./models/user");
const Request = require("./models/friend");
const Message = require("./models/message");
/*-------------------------------------- */
var server = app.listen("1000", () => console.log("Yo dawgs"));
var io = socket(server);
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toDateString() + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter
});
mongoose.Promise = global.Promise;
mongoose.connect(config.database, {
  useNewUrlParser: true
});
let db = mongoose.connection;
db.once("open", () => console.log("Connected to mongodb"));
db.on("error", err => {
  console.log(err);
});
passportConfig(passport);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
      mongooseConnection: db
    })
  })
);
app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
  } else {
    next();
  }
});
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = messages(req, res);
  next();
});
app.get("*", (req, res, next) => {
  if (req.session.passport !== undefined) {
    User.findById(req.session.passport.user, (err, user) => {
      res.locals.user = user || null;
    });
  }
  next();
});
/*----------- Requiring Routes ----------------*/
let users = require("./routes/users");
app.use("/user", users);
let posts = require("./routes/post");
app.use("/post", posts);
/*---------------------------------------------- */
// ROUTES
// app.get('/imageUpload',function(req,res){
//     console.log(__dirname);
//     res.sendFile(__dirname + '/public/index.html');

//   });

app.get("/", async (req, res) => {
  res.send('Hello')
  // try {
  //   const loggedUser = await userLoggedIn(req, res);
  //   if (loggedUser === null || loggedUser === undefined) res.render("register");
  //   else {
  //     if (!loggedUser.profilePicture)
  //       res.render("displaysettings", {
  //         loggedUser
  //       });
  //     else {
  //       const post = await Post.find({});
  //       let friendPosts = post.filter(p => {
  //         return loggedUser.friends.includes(p.authorid);
  //       });
  //       let myownPosts = post.filter(p => {
  //         return loggedUser.id === p.authorid;
  //       });
  //       let allPosts = myownPosts.concat(friendPosts);
  //       let sorted = sortingPosts(allPosts);
  //       const request = await requestRecieved(loggedUser);
  //       let pendingRequest = request.filter(r => {
  //         return r.status === 1;
  //       });
  //       let acceptedRequest = request.filter(r => {
  //         return r.status === 2;
  //       });
  //       if (acceptedRequest.length !== 0) {
  //         addFriends(acceptedRequest, pendingRequest, res, sorted);
  //       } else {
  //         if (req.query.name) {
  //           var users = await User.find({});
  //           var options = {
  //             keys: ["name", "email"],
  //             id: "name"
  //           };
  //           var fuse = new Fuse(users, options);
  //           var results = fuse.search(req.query.name);
  //           return res.send(results)

  //           // var books = [{
  //           //     'ISBN': 'A',
  //           //     'title': "Old Man's War",
  //           //     'author': 'John Scalzi'
  //           //   }, {
  //           //     'ISBN': 'B',
  //           //     'title': 'The Lock Artist',
  //           //     'author': 'Steve Hamilton'
  //           //   }]
  //           //   var options = {
  //           //     keys: ['title', 'author'],
  //           //     id: 'author'
  //           //   }
  //           //   var fuse = new Fuse(books, options)
  //           //   let ans = fuse.search('j')
  //           //   console.log(ans)
  //         }else{
  //           res.render("home", {
  //               loggedUser,
  //               data: sorted,
  //               requests: request
  //         });
  //         }
  //         //   res.render("home", {
  //         //     loggedUser,
  //         //     data: sorted,
  //         //     requests: request
  //         //   });
  //       }
  //     }
  //   }
  // } catch (err) {
  //   throw err;
  // }
});
app.post("/:id", upload.single("fileupload"), (req, res) => {
  if (!req.body.status && !req.file) {
    req.flash("Nothing to Add");
    return res.redirect("/");
  }
  User.findById(req.params.id, (err, user) => {
    if (err) throw err;
    Post.find({}, (err, post) => {
      if (err) throw err;
      const dateTime = {
        date: new Date().toDateString(),
        time: {
          hours: new Date().getHours(),
          mins: new Date().getMinutes(),
          secs: new Date().getSeconds()
        }
      };
      let newPost = new Post({
        authorid: user.id,
        author: user.name,
        body: req.body.status || "",
        datePosted: dateTime
      });
      if (req.file === undefined) {
        newPost.save(err => {
          if (err) throw err;
          req.flash("success", "Post added");
          res.redirect("/");
        });
      } else {
        newPost.image = "\\" + req.file.path;
        newPost.save(err => {
          if (err) throw err;
          req.flash("success", "Post added");
          res.redirect("/");
        });
      }
    });
  });
});
app.get("/search", async (req, res) => {
  // try {
  //     const loggedUser = await User.findById(req.session.passport.user);
  //     const requests = await Request.find({
  //         recipent: loggedUser.id
  //     });
  //     const regex = new RegExp(escapeRegex(req.query.search), 'gi');
  //     const searchedUser = await User.find({
  //         name: regex
  //     });
  //     res.render('search', {
  //         loggedUser,
  //         results: searchedUser,
  //         requests
  //     });
  // } catch (err) {
  //     throw err;
  // }
});
app.get("/messages/:id", async (req, res) => {
  try {
    const loggedUser = await User.findById(req.session.passport.user);
    const user = await User.findById(req.params.id);
    const messages = await Message.find({
      reciever: loggedUser.id,
      sender: user.id
    });
    const mymessages = await Message.find({
      sender: loggedUser.id,
      reciever: user.id
    });
    const allmessages = messages.concat(mymessages);
    const friendarr = await find(loggedUser);
    const sortedmessaged = sortingMessages(allmessages);
    res.render("contact", {
      loggedUser,
      allFriends: friendarr,
      messagesRecived: sortedmessaged
    });
  } catch (err) {
    throw err;
  }
});
app.get("/contact", async (req, res) => {
  const loggedUser = await User.findById(req.session.passport.user);
  const messagesRecived = await Message.find({
    reciever: loggedUser.id
  });
  const sortedmessaged = sortingMessages(messagesRecived);
  console.log("messages recieved =>");
  console.log(messagesRecived);
  const friendarr = await find(loggedUser);
  res.render("contact", {
    loggedUser,
    allFriends: friendarr,
    messagesRecived: sortedmessaged
  });
});
var connectedUsers = {};
io.on("connection", async socket => {
  try {
    socket.on("register", senderEmail => {
      console.log("User registered");
      socket.senderEmail = senderEmail;
      connectedUsers[senderEmail] = socket;
    });
    socket.on("private_msg", async data => {
      const to = data.to,
        message = data.message;
      const userto = await User.find({
        email: to
      });
      const userSender = await User.find({
        email: socket.senderEmail
      });
      const dateTime = {
        date: new Date().toDateString(),
        time: {
          hours: new Date().getHours(),
          mins: new Date().getMinutes(),
          secs: new Date().getSeconds()
        }
      };
      let newMessage = new Message({
        senderName: userSender[0].name,
        sender: userSender[0].id,
        recieverName: userto[0].name,
        reciever: userto[0].id,
        messageBody: message,
        status: 1,
        datePosted: dateTime
      });
      await newMessage.save();
      if (connectedUsers.hasOwnProperty(to)) {
        connectedUsers[to].emit("private_msg", {
          email: socket.senderEmail,
          message
        });
      }
    });
  } catch (err) {
    throw err;
  }
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
async function find(user) {
  var friendArray = user.friends.map(id => {
    return User.findById(id).exec();
  });
  return await Promise.all(friendArray);
}

app.get("/test", async (req, res) => {
  const user = await User.findById(req.session.passport.user);
  const friendarr = await find(user);
  // afunction(req);
  // var user = await User.findById(req.session.passport.user);
  // await find(user);
  // display();
  // User.findById(req.session.passport.user)
  // .then(function(user){
  //     var friendArray = user.friends.map(function(id){
  //         return User.findById(id).exec()
  //     });
  //     return Promise.all(friendArray);
  // })
  // .then(function(all){
  //     res.render('test',{
  //         allFriends:all
  //     })
  // })
});

// = = Function to find logged in user

async function userLoggedIn(req) {
  if (
    req.session.passport === undefined ||
    Object.entries(req.session.passport).length === 0
  ) {
    return null;
  } else {
    const loggedUser = await User.findById(req.session.passport.user);
    return loggedUser;
  }
}

// = = Function to Sort posts according to date
function sortingMessages(allMessages) {
  let sorted = allMessages.sort((a, b) => {
    if (a.datePosted.date !== b.datePosted.date) {
      return (
        new Date(b.datePosted.date).getTime() -
        new Date(a.datePosted.date).getTime()
      );
    }
    if (a.datePosted.time.hours === b.datePosted.time.hours) {
      if (a.datePosted.time.mins === b.datePosted.time.mins) {
        return b.datePosted.time.secs - a.datePosted.time.secs;
      } else {
        return b.datePosted.time.mins - a.datePosted.time.mins;
      }
    } else {
      return b.datePosted.time.hours - a.datePosted.time.hours;
    }
  });
  return sorted;
}

function sortingPosts(allPosts) {
  let sorted = allPosts.sort((a, b) => {
    console.log(a)
    console.log(b)
    if (a.datePosted.date !== b.datePosted.date) {
      return (
        new Date(b.datePosted.date).getTime() -
        new Date(a.datePosted.date).getTime()
      );
    }
    if (a.datePosted.time.hours === b.datePosted.time.hours) {
      if (a.datePosted.time.mins === b.datePosted.time.mins) {
        return b.datePosted.time.secs - a.datePosted.time.secs;
      } else {
        return b.datePosted.time.mins - a.datePosted.time.mins;
      }
    } else {
      return b.datePosted.time.hours - a.datePosted.time.hours;
    }
  });
  return sorted;
}

// = = Function to find requests recieved by Logged in user

async function requestRecieved(loggedUser) {
  const requests = await Request.find({
    recipent: loggedUser.id
  });
  return requests;
}

// = = Function to add friends in both requestors and recipens friend array

function addFriends(friendArray, pendingRequest, res, sorted) {
  friendArray.map(r => {
    User.findById(r.recipent, (err, user) => {
      if (err) throw err;
      let query = {
        _id: user.id
      };
      let friend = r.requestor;
      User.updateOne(
        query,
        {
          $push: {
            friends: friend
          }
        },
        err => {
          if (err) throw err;
        }
      );
    });
    User.findById(r.requestor, (err, user) => {
      if (err) throw err;
      let query = {
        _id: user._id
      };
      let friend = r.recipent;
      User.updateOne(
        query,
        {
          $push: {
            friends: friend
          }
        },
        err => {
          if (err) throw err;
        }
      );
      let Delquery = {
        _id: r._id
      };
      Request.deleteOne(Delquery, err => {
        if (err) throw err;
        res.render("home", {
          user,
          data: sorted,
          requests: pendingRequest
        });
      });
    });
  });
}
//===============================================================================
//===============================================================================
//===============================================================================
