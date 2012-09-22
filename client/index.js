var io = require('socket.io-client'),
	os = require("os"),
	socket,
	stderrHooked,
	stdoutHooked,
	session,
	enabled;

module.exports.isConnected = function () {
	return !!socket;
};

// Connects to node-console.io server instance
// options = {
//		endpoint: Required string. Server's Url.
//		name: Required string. Client instance´s unique name
//		timeout: Optional int. Socket's timeout in MS. Default 5000.
//		hostname: Optional string. Machine's name. Default is the hostname.
// }
module.exports.connect = function(options, cb) {

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
		if (cb) return cb(err);
		throw err;
	}

	// Set initial status
	session = {};
	enabled = {
		value: false,
		fnOut: push('stdout'),
		fnErr: push('stderr')
	};
	// Set default values
	options.hostname = options.hostname || os.hostname();
	options.timeout = options.timeout || 5000;

	// set socket's options
	var socketOptions = {
		'connect timeout' : options.timeout,
		'reconnect': true,
		'reconnection delay': 1000,
		'max reconnection attempts': 10
	};

	console.log('Connecting to console.io server using this options:', options);
	socket = io.connect(options.endpoint, socketOptions);

	socket.on('connect', function () {
		console.log('Connected to console.io server.');
		if (cb) cb();
	});

	socket.on('error', function (data) {
		console.log('Connection to console.io server failed:', data);
		if (cb) cb(data);
	});

	console.log('Sending identity to console.io server.');
	socket.emit('set identity', {
		hostname: options.hostname,
		name:  options.name
	});

	socket.on('ready', function () {
		console.log('Ready to start logging to console.io');
		enable();
		socket.on('enabled', doEnabled);
		socket.on('exec', doExec);
	});

};

// Disonnects from node-console.io server instance
module.exports.disconnect = function(cb){

	if (socket) {
		// Disable logging to console.io
		diable();

		// Disconect from socket
		socket.on('disconnect', function () {
			console.log('Disconected from console.io server.');
			socket = null;
			if (cb) cb();
		});

		console.log('Disconecting from console.io server.');
		socket.disconnect();
	}

	// Release session
	session = null;
};

// Executes a command received from console.io server
doExec = function(code)
{
	try
	{
		// Logs the code that will be executed
		enabled.fnOut(code + '\n');

		// Compiles the code
		var fn = eval('(function (){' + code  +'});');

		// Execute the code using the current session
		var result = fn.call(session);

		// Logs execution's result
		enabled.fnOut(result);
	}
	catch (e)
	{
		// Logs compilation or execution error
		enabled.fnErr(e);
	}
};

// Manages Enabled property
doEnabled = function(value, fn){
	if (value!==null) {
		if (value) enable(); else disable();
	}
	// returns enabled value
	fn(enabled.value);
};

// hooks stream's write function
hookStream = function(stream, writeFn) {
	// keeps current write implementation
	var instance = {
		oldWrite: stream.write,
		unhook : function() {
			stream.write = this.oldWrite;
		}
	};

	// overrites the string.write function with the new one
    stream.write = function(){
		instance.oldWrite.apply(stream, arguments);
		writeFn.apply(stream, arguments);
    };
    return instance;
};

// Pushs a console.log invocation to the console.io server instance
push = function(source){
	return function(data, encoding, fd) {
		socket.emit('log', {
			source: source,
			data: data
		});
	};
};

// Enables push logging to console.io server
// All invocations to console.log and console.error methos will
// be forwarded to console.io server instance
enable = function(){
	// Hooks std streams
	if (!stdoutHooked) stdoutHooked = hookStream(process.stdout, push('stdout'));
	if (!stderrHooked) stderrHooked = hookStream(process.stderr, push('stderr'));

	// enables pushing
	enabled.value = true;
	enabled.fnErr = enabled.fnOut = console.log;

	console.log("console.io was enabled");
};

// Disables push logging to console.io server
// All invocations to console.log and console.error methods will be not
// forwarded to the console.io server.
// Only 'exec' commands received from the console.io server will be forwarded.
// The execution of those commands will not have an echo on nodejs's console.
disable = function(){
	console.log("console.io was disabled");

	// Releases std streams
	if (stdoutHooked) {
		stdoutHooked.unhook();
		stdoutHooked = null;
	}

	if (stderrHooked) {
		stderrHooked.unhook();
		stderrHooked = null;
	}

	// Disables pushing
	enabled.value = false;
	enabled.fnOut = push('stdOut');
	enabled.fnErr = push('stdErr');
};
