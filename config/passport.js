const localStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const config = require('../config/database');
module.exports = function(passport){
    passport.use(new localStrategy({
        usernameField:'email'
    },(username,password,done)=>{
        
        let query = {email:username};
        User.findOne(query,(err,user)=>{
            if(err) throw err;
            if(!user){
                return done(null,false,{message:'No user found'});
            }
            bcrypt.compare(password,user.password,(err,isMatch)=>{
                if(err) throw err;
                if(!isMatch){
                    return done(null,false,{message:'Wrong Password'});
                }else{
                    return done(null,user);
                }
            });
        });
    }));
    
    passport.serializeUser((user,done)=>{
        done(null,user.id);
   });
   passport.deserializeUser((id,done)=>{
        User.findById(id,(err,user)=>{
        done(err,user);
    });
   });
}