var openid = require('openid');
var express = require('express');
var redis = require('redis');
var url = require('url');
var querystring = require('querystring');
var req = require('request');
// var session = require('express-session');
// var RedisStore = require('connect-redis')(session);
var app = express();


app.configure(function() {
  	app.set('views', __dirname);
  	app.set('view engine', 'jade');
  	app.use(express.logger());
	app.use(express.cookieParser());
	app.use(express.cookieSession({
	  key: 'app.sess',
	  secret: 'SUPERsekret'
	}));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

// ({ 
// 		key: 'student-portal',
// 		store: '',
// 		// store: new RedisStore({
// 		// 	host: "localhost",
// 		// 	port: "8888",
// 		// 	db: "session-db"
// 		// }),
// 		secret: 'my_precious' })

var extensions = [new openid.UserInterface(), 
                  new openid.SimpleRegistration(
                      {
                        "nickname" : true, 
                        "email" : true, 
                        "fullname" : true,
                        "country" : true
                      }),
                  new openid.AttributeExchange(
                      {
                        "http://axschema.org/contact/email": "required",
                        "http://axschema.org/namePerson/friendly": "required",
                        "http://axschema.org/namePerson": "required",
                        "http://openid.net/schema/person/guid": "required"
                      }),
                  new openid.PAPE(
                      {
                        "max_auth_age": 24 * 60 * 60, // one day
                        "preferred_auth_policies" : "none" //no auth method preferred.
                      })];

var relyingParty = new openid.RelyingParty(
    'http://localhost:8888/verify', // Verification URL (yours)
    null, // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    extensions); // List of extensions to enable and include



app.get('/', function(req, res) {
	res.render('login');
});
app.get('/hello', checkAuth, function(req,res) {
	res.render('hello');
});

app.get('/authenticate', function(req, res) {
	var identifier = 'https://www.udacity.com/openid';

	// Resolve identifier, associate, and build authentication URL
	relyingParty.authenticate(identifier, false, function(error, authUrl) 	{
		if (error) {
			res.writeHead(200);
			res.end('Authentication failed: ' + error.message);
		}
		else if (!authUrl) {
			res.writeHead(200);
			res.end('Authentication failed');
		}
		else {
			res.writeHead(302, { Location: authUrl });
			res.end();
		}
	});
});

app.get('/verify', function(req, res) {
	// Verify identity assertion
	// NOTE: Passing just the URL is also possible
	// console.log(request);
	// console.log('Now response');
	relyingParty.verifyAssertion(req, function(error, result) {
		//response.writeHead(200);

		if (!error && result.authenticated) {
			if (result.country === 'udacity') {
				req.session.user = 'udacity';
				console.log('Welcome Udacian!');
				res.redirect('https://student-portal.udacity.com');

			} else {
				res.redirect('http://www.google.com');
			}
		} else {
			console.log('Fail');
			res.render('/');
		}

		// response.end(!error && result.authenticated 
		// 	? 'Success :)' // TODO: redirect to something interesting!
		// 	: 'Failure :('); // TODO: show some error message!
	});
});

//Authorization check
function checkAuth(req, res, next) {
  if (req.session && req.session.user==='udacity' )
     next();
  else
     res.redirect('/');
}

app.listen(8888);
module.exports = app;