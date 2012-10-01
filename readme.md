Console.io allows you to access the console of your running node.js instances
and even execute code remotely.

## Features

- Read the stderr and stdout from a website in real-time.
- Execute code remotely in a specific running node.js process.
- Built in dashboard allows for multiple consoles at the same time.
- Hookable api for using console.io in your own front end.

## Running the Dashboard

1.-  node app.js
2.-  open http://localhost:8080 in the browser (dashboard).
3.-  cd client && node sample.js
4.-  open http://localhost:8081 in the browser.

In order to see another console in the dashboard, run sample2.js (8082) as well.

### Logs
Logs will start showing in real time. Errors will be displayed in red.

### Prompt
There will be a prompt with the name of the host, where you can start running
scripts. Notice that if you want to see something in the output you are going
to have to either:

- Call console.log('your message') from within your script.
- Return whatever to want to be printed.

#### Examples
```js
	//this will print 4.
	return 2 + 2;

	//this will print undefined.
	2 + 2;

	//this will print 4 and then undefined.
	console.log(2 + 2);
```

The script will be printed right before the result, so that other dashboards
looking at the console, see the script and can make something out of the output

## Running console.io in your own Dashboard

If you would like to see the logs in your own front end, you pass an instance
of socket.io to the "server" module.

```js
    require('console.io/server').hook(io);
```

From the website perspective it's pretty easy to receive messages. You start by
subscribing to the 'web' namespace. You can see how it works in the 
\public\index.html file.

## Adding console.io to your node.js app

First install console.io-client from npm:

```
	npm install console.io-client
```

Then do this once in every node.js process:

```js
	ncc.connect(options, callback);
```

### Options

* `endpoint`: url to the dashboard.
* `name`: unique name of this particular node.js process.
* `disableExec`: disable the remote execution of code.

### Example

```js
	ncc.connect({
			endpoint: "http://localhost:8080/console.io-log",
			name: "marketplace"
		}, function(err, result){
	});
```

## License 

[MIT License](http://www.opensource.org/licenses/mit-license.php)