var io = require('socket.io-client');
var socket = io.connect('http://localhost:8080/node-rc-log');

socket.on('connect', function () {
	// socket connected
	console.log('socket connected.');
});

socket.on('disconnect', function () {
	// socket disconnected
	console.log('socket disconnected');
});

//TODO:First identify this client.
socket.emit('set identity', { 
	hostname: 'my hostname', 
	name: 'my app name'
});

socket.on('ready', function () {
	
	//TODO: send console.log ouptut.
	socket.emit('log', { my: 'data' });
	
	socket.on('exec', function (code) {
		// server emitted a custom event
		/*

		var conf = require('nconf');
		socket.emit('log', conf);

		*/

		var command = 'socket.emit("log", function () { ' + code  +' }())';
		eval(command);

		console.log('server emitted a custom event');
	});

});