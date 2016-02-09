var openid = require('openid');
var express = require('express');

var app = express();

app.configure(function() {
  app.set('views', __dirname);
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'my_precious' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

var relyingParty = new openid.RelyingParty(
    'http://localhost:8888/login/verify', // Verification URL (yours)
    null, // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    []); // List of extensions to enable and include

app.get('/login', function(request, response) {
	response.render('login');
});

app.get('/login/authenticate', function(request, response) {
	var identifier = request.query.openid_identifier;

	// Resolve identifier, associate, and build authentication URL
	relyingParty.authenticate(identifier, false, function(error, authUrl) 	{
		if (error) {
			response.writeHead(200);
			response.end('Authentication failed: ' + error.message);
		}
		else if (!authUrl) {
			response.writeHead(200);
			response.end('Authentication failed');
		}
		else {
			response.writeHead(302, { Location: authUrl });
			response.end();
		}
	});
});

app.get('/login/verify', function(request, response) {
	// Verify identity assertion
	// NOTE: Passing just the URL is also possible
	relyingParty.verifyAssertion(request, function(error, result) {
		response.writeHead(200);
		response.end(!error && result.authenticated 
			? 'Success :)' // TODO: redirect to something interesting!
			: 'Failure :('); // TODO: show some error message!
	});
});

// port
app.listen(8888);

module.exports = app;