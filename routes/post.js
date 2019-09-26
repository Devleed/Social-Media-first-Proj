const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
const User = require('../models/user');
const fs = require('fs');
router.get('/:id', (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if(err) throw err;
        User.findById(req.session.passport.user,(err,loggeduser)=>{
            let authorized = false;
            if (err) throw err;
            if (post.authorid === loggeduser.id) {
                console.log('authorized is true');
                authorized = true;
            }
            res.render('post', {
                user:loggeduser,
                post: post,
                authorized
            });
        })
        
    });
});

router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if (err) throw err;
        if (post.authorid !== req.session.passport.user) {
            console.log('not equal');
            req.flash('error', 'Not Authorized');
            res.redirect('/');
        } else {
            res.render('editpost', {
                post
            });
        }
    })
});
router.post('/edit/:id', (req, res) => {
    let newpost = {
        body: req.body.status || ''
    }
    let query = {
        _id: req.params.id
    };
    Post.updateOne(query, newpost, (err) => {
        if (err) throw err;
        req.flash('success', 'edited');
        res.redirect('/');
    })
});
router.delete('/:id', ensureAuthenticated, (req, res) => {
    if (!req.session.passport.user) {
        res.status(500).send();
    }
    let query = {
        _id: req.params.id
    };
    Post.findById(query, (err, post) => {
        if (err) throw err;
        if(post.image){
        var path = 'E:/WORK/Registration/'+post.image;
        }
        if (post.authorid != req.session.passport.user) {
            res.status(500).send();
        } else {
            Post.deleteOne(query, (err) => {
                // if(post.image){
                //     fs.unlink(path,(err)=>{
                //         if(err) throw err;
                //     })
                // }
                if (err) throw err;
                req.flash('danger', 'Deleted');
                res.send('success');
            })
        }
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('is autheticate');
        return next();
    } 
    else {
        req.flash('danger', 'login first');
        res.redirect('/user/login');
    }
}
module.exports = router;