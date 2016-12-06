const Hapi = require('hapi');
const server = new Hapi.Server();
const Inert = require('inert');
const Querystring = require('querystring');
const env = require('env2')('./config.env');
const Request = require('request');
const cookieAuth = require('hapi-auth-cookie');

const options = {
  password: 'somebnfdgfhhfhfhljhkb,bn,bnjmbjhthing',
  cookie: 'somecookie',
  ttl: 24 * 60 * 60 * 1000,
  isSecure: process.env.NODE_ENV === 'PRODUCTION',
  isHttpOnly: false
}

server.connection({
  port: 5000,
  host: 'localhost'
});

server.register([Inert,cookieAuth], (err) => {
  if (err) throw err;
  server.auth.strategy('base', 'cookie',options);
  server.route([
    {
      method:'GET',
      path:'/',
      handler: (req,rep) => {
          if (err) throw err;
          rep.file('./index.html');
      }
  },
  {
    method: 'GET',
    path: '/login',
    handler: (req,res) => {
      if (err) throw err;
      var query = {
        client_id : process.env.CLIENT_ID,
        redirect_uri: process.env.BASE_URL+'welcome'
      };
      res.redirect('https://github.com/login/oauth/authorize/?'+Querystring.stringify(query))
    }
  },
  {
    method: 'GET',
    path: '/welcome',
    handler: (req,reply) => {
      if (err) throw err;
      const query ={
        client_id : process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: req.url.query.code
      };
      Request.post({url:'https://github.com/login/oauth/access_token' , form: query},(err,res,body)=>{
          var token = Querystring.parse(res.body);
          console.log(token);
          console.log(req);
          req.cookieAuth.set(token);
          reply.redirect('/');
      });
    }
  },
  {
    method: 'GET',
    path: '/git',
    config: {
      auth: {
        strategy: 'base'
      },
      handler: (req,rep) => {
        if (err) throw err;
        if (req.auth.isAuthenticated){
          Request.get({
            url: 'https://api.github.com/user',
            headers: {
              'User-Agent': 'Test Oauth',
              Authorization: `token ${req.auth.credentials.access_token}`
            }
          },(err, res,body) => {
            if (err) throw err;
              rep(body);
          });
      };
    }
  }
  }]
);
  server.start(() => {
    console.log(`Server is running at port ${server.info.uri}`);
  });
});
