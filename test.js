var express = require('express');
var socket = require('socket.io');
var app = express();
const path = require('path');
var server = app.listen(8000, () => console.log('listening'));
// WARNING: app.listen(80) will NOT work here!
app.use(express.static(path.join(__dirname, 'public')));
var io = socket(server);
app.get('/', (req, res) => res.sendFile(__dirname + '/views/t.html'));
var connected = {};
io.on('connection', (socket) => {
    console.log('client connected');
    socket.on('register', sender => {
        socket.sender = sender;
        connected[sender] = socket;
        // if(connected.hasOwnProperty(to)){
        //     connected[to].emit('private_chat',{
        //         //The sender's username
        //         username : socket.username,
        //         //Message sent to receiver
        //         message : message
        //     });
        // }
    });
    socket.on('private msg', data => {
        const to = data.to,
              message = data.message;
        console.log(connected.hasOwnProperty(to));
        if (connected.hasOwnProperty(to)) {
            console.log(socket.sender);
            connected[to].emit('private msg', {
                //The sender's username
                username: socket.sender,
                //Message sent to receiver
                message: message
            });
        }
    })
});