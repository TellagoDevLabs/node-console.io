module.exports.hook = function ( io ) {

        //log communicates with all the different consoles.
    var log = io.of('/console.io-log'),
        //we use web to communicate with the different websites.
        web = io.of('/console.io-web'),
        clients = {};
    /*
    consoles.
    */
    /*
    * Before we can start sending messages to the web, we need to know
    * from which console it's comming from.
    */
    log.on('connection', function ( socket ) {

        socket.on('set identity', function ( id ) {

            var _id = (id.hostname + id.name);
            if (!clients[_id]) {
                //if it's a new console, assign id.
                clients[_id] = id;
            }

            clients[_id]._id = _id;
            //in case of reconnect of the client update the socket.
            clients[_id].socket = socket;
            
            socket.set('identity', _id, function () {
                //let the console know it's ok to start sending logs.
                socket.emit('ready');
                //notify the website that a new console arrived.
                web.emit('new-console', {
                    _id: _id,
                    hostname: id.hostname,
                    name: id.name
                });
            });
        });

        //send console.log to the website channel.
        socket.on('log', function (data) {
            //if _id is null, then the console did not emit 'set identity'
            //{hostname, name} yet. it's ok ot discard.
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

    });

    web.on('connection', function ( socket ) {

        //send the current list of consoles to the website upon
        //first connect.
        for(var i in Object.keys(clients)) {
            socket.emit('new-console', {
                    _id: clients[i]._id,
                    hostname: clients[i].hostname,
                    name: clients[i].name
                });
        }

        //we receive commands to execute in the console's context.
        socket.on('exec', function ( data ) {
            var client = clients[data._id];
            if (client && client.socket) {
                client.socket.emit('exec', data.command);
            }
        });
    });

};