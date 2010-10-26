var http		 = require("http");
var io       = require("socket.io");
var sys      = require("sys");

var nstatic  = require("node-static");

var SuperClass = require("./superclass");
var Connection = require("./connection");

var crypto = require("crypto"),
      path = require("path");
        fs = require("fs");

var credentials;
if (path.existsSync("keys/privatekey.pem")) {
  var privateKey  = fs.readFileSync("keys/privatekey.pem", "utf8");
  var certificate = fs.readFileSync("keys/certificate.pem", "utf8");
  credentials = crypto.createCredentials({key: privateKey, cert: certificate});
}

Server = module.exports = new SuperClass;

var fileServer = new nstatic.Server("./public");

Server.include({
  listen: function(app){
		if(typeof app=="object") {
		  if (credentials)
	      app.setSecure(credentials);
	
	    this.socket = io.listen(app);
	    this.socket.on("connection", function(stream){ new Connection(stream) });
		} else {
			this.httpServer = http.createServer(function(request, response){
	      request.addListener("end", function() {
    
	        fileServer.serve(request, response, function (err, res) {
	          if (err) { // An error as occured
	            sys.error("> Error serving " + request.url + " - " + err.message);
	            response.writeHead(err.status, err.headers);
	            response.end();
	          } else { // The file was served successfully
	            sys.log("Serving " + request.url + " - " + res.message);
	          }
	        });
    
	      });
	    });
	    if (credentials)
	      this.httpServer.setSecure(credentials);

	    this.socket = io.listen(this.httpServer);
	    this.socket.on("connection", function(stream){ new Connection(stream) });
	    
			this.httpServer.listen(app);
		}
  }
});