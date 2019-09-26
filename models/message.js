const mongoose = require('mongoose');
const messageSchema = mongoose.Schema({
    senderName:{
        type: String,
        required: true
    },
    sender:{
        type: String,
        required: true
    },
    recieverName:{
        type: String,
        required: true
    },
    reciever:{
        type: String,
        required: true
    },
    messageBody:{
        type: String,
        required: true
    },
    datePosted:{
        type: Object,
        required: true
    },
    status:{
        type:Number,
        required:true
    }
});
const Message = module.exports = mongoose.model('Message',messageSchema);