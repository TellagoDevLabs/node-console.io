var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

server.listen(8080);

app.get('/', function ( req, res ) {
    res.sendfile(__dirname + '/index.html');
});

var log = io.of('/node-rc-log'),
    web = io.of('/web');

log.on('connection', function ( socket ) {

    socket.on('set identity', function ( id ) {
        console.log('identity: ' + JSON.stringify(id));
        socket.set('identity', id, function () {
            socket.emit('ready');
        });
    });

    socket.on('log', function (data) {
        socket.get('identity', function ( err, id ) {
            web.emit('news', {
                id: id,
                data: data
            });
        });
    });

    //TODO: get commands from the web.
    //socket.emit('exec', "return 2 + 2");
});