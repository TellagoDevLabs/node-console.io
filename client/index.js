var io = require('socket.io-client'),
	os = require("os"), 
	socket,
	stderrHooked,
	stdoutHooked;

module.exports.isConnected = function () {
	return !!socket;
}

module.exports.connect = function(options, cb){

	// Validate arguments
	var err = null;
	if (socket) {
		err = new Error('node-console-client is already connected.');
	}
	else if (typeof(options)!=='object') {
		err = new Error("'options' argument is required.");
	}
	else if (!(options.endpoint)) {
		err = new Error("'options.endpoint' argument is required.");
	}
	else if (!(options.name)) {
		err = new Error("'options.name' argument is required.");
	}
	
	if (err) {
		if (cb) return cb(err)
		throw err;
	}

	// Set default values for arguments
	options.hostname = options.hostname || os.hostname();
	options.timeout = options.timeout || 5000;

	// set socket's options
	var socketOptions = {
		'connect timeout' : options.timeout,
		'reconnect': true,
		'reconnection delay': 1000,
		'max reconnection attempts': 10
	};

	socket = io.connect(options.endpoint, socketOptions);

	socket.on('connect', function () {
		if (cb) cb();
	});

	socket.on('error', function (data) {
		if (cb) cb(data);
	});

	socket.emit('set identity', { 
		hostname: options.hostname, 
		name:  options.name
	});

	stdoutHooked = hookStream(process.stdout, send('stdout'));
	stderrHooked = hookStream(process.stderr, send('stderr'));

	socket.on('exec', doExec);
};

module.exports.disconnect = function(cb){

	if (socket) {
		
		if (stdoutHooked) {
			stdoutHooked.unhook();
			stdoutHooked = null;
		} 

		if (stderrHooked) {
			stderrHooked.unhook();
			stderrHooked = null;
		} 

		socket.on('disconnect', function () {
			socket = null;
			if (cb) cb();
		});

		socket.disconnect();
	}
}

 doExec = function(code)
{
	try
	{
		process.stdout.write(code + '\r');
		console.log(eval('(function (){' + code  +'})();'));
	}
	catch (e)
	{
		console.log(e);
	}
}

hookStream = function(stream, writeFn) {
    var oldWrite = stream.write;
    stream.write = function(){
    	oldWrite.apply(stream, arguments);
    	writeFn.apply(stream, arguments);
    };
    return { unhook : function() { stream.write = oldWriteFn; } };
}

send = function(source){
	return function(data, encoding, fd) {
		socket.emit('log', {
			source: source,
			data: data
		});
	};
}

