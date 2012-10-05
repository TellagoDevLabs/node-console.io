/*
options:
    - key: the secret key that the console.io-client will need for connecting
           to this dashboard.
    - secure: use the handshake.user.key to validate the web user.
*/
module.exports.hook = function ( io, options ) {

    console.log('hooking console.io...');

    options = options || {};
        
    var key = options.key || '',
        //log communicates with all the different consoles.
        log = io.of('/console.io-log' + key),
        //we use web to communicate with the different websites.
        web = io.of('/console.io-web' + key),
        clients = {};
    /*
    consoles.
    */
    /*
    * Before we can start sending messages to the web, we need to know
    * from which console it's comming from.
    */
    log.on('connection', function ( socket ) {

        /*
        params:
            - id: { hostname: string, name: string }
        */
        socket.on('set identity', function ( id ) {

            if (!id || !id.hostname) return;

            var _id = (id.hostname + id.name);

            //if it's a new console, assign id.
            if (!clients[_id]) clients[_id] = id;

            //in case of reconnect of the client update the asocket.
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


        function pushToWeb( source ) {
            return function ( data ) {
                //if _id is null, then the console did not emit 'set identity'
                //{hostname, name} yet. it's ok ot discard.
                socket.get('identity', function ( err, _id ) {
                    if (_id) {
                        web.emit('news', {
                            _id: _id,
                            source: source,
                            data: data.data
                        });
                    } else {
                        console.log('the console socket didnt have the identity.');
                    }
                });
            };
        }

        //send console output to the website channel.
        socket.on('stdErr', pushToWeb( 'stderr' ));
        socket.on('stdOut', pushToWeb( 'stdout' ));

    });

    web.on('connection', function ( socket ) {

        console.log ('new connection');

        if ( options.secure && socket.handshake.user.key !== options.key ) {
            console.log('refusing the connection');
            socket.disconnect();
        }

        console.log('connection accepted.');

        //send the current list of consoles to the website upon
        //first connect.
        for(var i in clients) {
            socket.emit('new-console', {
                    _id: i,
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

    return { log: log, web: web };
};