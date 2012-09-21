var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

server.listen(8080);

app.configure(function(){
    app.use(express["static"](__dirname + '/public'));
});

var log = io.of('/node-rc-log'),
    web = io.of('/web');

var clients = [];

log.on('connection', function ( socket ) {

    socket.on('set identity', function ( id ) {

        //make sure it's not an old one.
        var client = clients.filter( function ( c ) {
            return id.hostname === c.hostname && id.name === c.name;
        })[0];

        if (!client) {
            id._id = new Date().getTime();
            clients.push(id);
        } else {
            id._id = client._id;
        }

        socket.set('identity', id, function () {
            socket.emit('ready');
            web.emit('new-console', id);
        });
    });

    socket.on('log', function (data) {
        socket.get('identity', function ( err, id ) {
            if (id) {
                web.emit('news', {
                    _id: id._id,
                    data: data
                });
            }
        });
    });

    //TODO: get commands from the web.
    //socket.emit('exec', "return 2 + 2");
});

web.on('connection', function ( socket ) {
    for(var i in clients) {
        socket.emit('new-console', clients[i]);
    }
});