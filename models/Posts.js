const mongoose = require('mongoose');
const postSchema = mongoose.Schema({
    authorid:{
        type: String,
        required: true
    },
    author:{
        type: String,
        required:true
    },
    body:{
        type: String
    },
    datePosted:{
        type: Object,
        required: true
    },
    image:{
        type: String
    }
});
const Post = module.exports = mongoose.model('Post',postSchema);