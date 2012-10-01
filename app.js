/*
*  This site is an express front end for the console.io.
*  you can build your own front end if you don't like this
*  one. Just hook console.io into your socket.io and follow
*  the "web" channel.
*/
var http      = require('http'),
    express   = require('express'),
    socketio  = require('socket.io'),
    app       = express(),
    server    = http.createServer(app),
    io        = socketio.listen(server),
    consoleio = require('./server');

app.configure(function(){
    app.use(express["static"](__dirname + '/public'));
});

server.listen(8080);

//hook to console.io
consoleio.hook(io);