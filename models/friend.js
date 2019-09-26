const mongoose = require('mongoose');
const friendRequest = mongoose.Schema({
    requestorName:{
        type: String,
        required: true
    },
    requestor:{
        type: String,
        required: true
    },
    recipentName:{
        type: String,
        required: true
    },
    recipent:{
        type: String,
        required: true
    },
    status:{
        type:Number,
        required:true
    }
});
const Request = module.exports = mongoose.model('Request',friendRequest);