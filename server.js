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
            id.socket = socket;
            clients.push(id);
        } else {
            //in case of reconnect of the client.
            id._id = client._id;
            client.socket = socket;
        }

        socket.set('identity', id._id, function () {
            socket.emit('ready');
            web.emit('new-console', {
                _id: id._id,
                hostname: id.hostname,
                name: id.name
            });
        });
    });

    socket.on('log', function (data) {
        socket.get('identity', function ( err, _id ) {
            if (_id) {
                web.emit('news', {
                    _id: _id,
                    source: data.source,
                    data: data.data
                });
            }
        });
    });

    //TODO: get commands from the web.
    //socket.emit('exec', "return 2 + 2");
});

web.on('connection', function ( socket ) {
    for(var i in clients) {
        socket.emit('new-console', {
                _id: clients[i]._id,
                hostname: clients[i].hostname,
                name: clients[i].name
            });
    }

    socket.on('exec', function ( data ) {

        console.log("exec'ing", JSON.stringify( data ));

        var client = clients.filter(function ( c ) { return c._id === data._id; })[0];
        console.log('client: ' + client);
        if (client) {
            client.socket.emit('exec', data.command);
        }

    });
});
