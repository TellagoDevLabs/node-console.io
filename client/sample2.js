var ncc = require("console.io-client"),
	app = require('express')(),
    server = require('http').createServer(app);

app.use(function(req, res, next){
    console.log('\n'+ req.method +' '+req.url,'\n', req.body);
    next();
});

ncc.connect({
		endpoint: "http://localhost:8080",
		name: "apphost"
	}, function(err, result){
});

server.listen(8082);