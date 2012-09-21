var io = require('socket.io-client'),
	os = require("os"), 
	socket,
	stderrHooked,
	stdoutHooked,
	session,
	enabled;

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

	// Set initial status
	session = {};
	enabled = {
		status: false,
		fn: send
	};

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

	socket.on('ready', function () {

		console.log('ready to start logging to console.io');
		enable();
		socket.on('enabled', doEnabled);
		socket.on('exec', doExec);
	});

};

module.exports.disconnect = function(cb){

	if (socket) {
		
		diable();		

		socket.on('disconnect', function () {
			socket = null;
			if (cb) cb();
		});

		socket.disconnect();
	}
	session = null;
}

doExec = function(code)
{
	try
	{
		enabled.fn(code + '\n');
		var fn = eval('(function (){' + code  +'});')
		var result = fn.call(session);
		enabled.fn(result);
	}
	catch (e)
	{
		console.error(e);
	}
}

doEnabled = function(value, fn){
	if (value===true) enable();
	else if (value===false) disable();
	fn(enabled.status)
};

hookStream = function(stream, writeFn) {
    var instance = { 
    	oldWrite: stream.write,
    	unhook : function() { 
    		stream.write = this.oldWrite; 
    	},
    };

    stream.write = function(){
    	instance.oldWrite.apply(stream, arguments);
    	writeFn.apply(stream, arguments);
    };
    return instance;
}

send = function(source){
	return function(data, encoding, fd) {
		socket.emit('log', {
			source: source,
			data: data
		});
	};
}

enable = function(){
	if (!stdoutHooked) stdoutHooked = hookStream(process.stdout, send('stdout'));
	if (!stderrHooked) stderrHooked = hookStream(process.stderr, send('stderr'));
	enabled.status = true;
	enabled.fn = console.log;
	console.log("console.io was enabled");
}

disable = function(){
	console.log("console.io was disabled");

	if (stdoutHooked) {
		stdoutHooked.unhook();
		stdoutHooked = null;
	} 

	if (stderrHooked) {
		stderrHooked.unhook();
		stderrHooked = null;
	} 
	enabled.status = false;
	enabled.fn = send;
}