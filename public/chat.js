var socket = io.connect('http://localhost:1000');

var senderEmail = document.getElementById('demo').value
socket.emit('register', senderEmail);
var out = document.getElementById("allmessages");
$(document).ready(() => {
    $('#sendMessagebtn').on('click', () => {
        var reciever = document.getElementById('reciever').value,
            textmessage = document.getElementById('textmessage').value;
        var newElement = document.createElement("div");
        newElement.innerHTML = textmessage;
        newElement.classList.add('mesg');
        newElement.classList.add('ownmesg');
        out.insertBefore(newElement, out.firstChild);
        console.log('button clicked')
        socket.emit('private_msg', {
            to: reciever,
            message: textmessage
        })
    })
})

socket.on('private_msg', data => {
    var newElement = document.createElement("div");
    newElement.innerHTML = data.message;
    newElement.classList.add('mesg');
    out.insertBefore(newElement, out.firstChild);
});