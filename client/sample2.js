var ncc = require("./index.js"),
	app = require('express')(),
    server = require('http').createServer(app);

var ping = function(name) {
	console.log('Hello ' + name + '!')
}
app.use(function(req, res, next){
    console.log('\n'+ req.method +' '+req.url,'\n', req.body);
    next();
});

ncc.connect({
	endpoint: "http://localhost:8080/node-rc-log",
	name: "apphost"
}, function(err, result){
});	

server.listen(8082);

