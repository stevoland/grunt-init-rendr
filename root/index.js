var express = require('express'),
    rendr = require('rendr'),
    env = require('./server/lib/env'),
    mw = require('./server/middleware'),
    DataAdapter = require('./server/lib/data_adapter'),
    app,
    server;

app = express();

/**
 * Initialize Express middleware stack.
 */
function initMiddleware() {
  app.use(express.compress());
  app.use(express.static(__dirname + '/public'));
  app.use(express.logger());
  app.use(express.bodyParser());

  /**
   * Rendr routes are attached with `app.get()`, which adds them to the
   * `app.router` middleware.
   */
  app.use(app.router);

  /**
   * Error handler goes last.
   */
  app.use(mw.errorHandler());
}

/**
 * Initialize our Rendr server.
 *
 * We can pass inject various modules and options here to override
 * default behavior:
 * - dataAdapter
 * - errorHandler
 * - notFoundHandler
 * - appData
 */
function initServer() {
  var options = {
    dataAdapter: new DataAdapter(env.current.api),
    errorHandler: mw.errorHandler(),
    appData: env.current.rendrApp
  };
  server = rendr.createServer(app, options);
}

/**
 * Start the Express server.
 */
function start() {
  var port = process.env.PORT || 3030;
  app.listen(port);
  console.log("server pid %s listening on port %s in %s mode",
    process.pid,
    port,
    app.settings.env);
}

/**
 * Here we actually initialize everything and start the Express server.
 *
 * We have to add the middleware before we initialize the server, otherwise
 * the 404 handler gets too greedy, and intercepts i.e. static assets.
 */
initMiddleware();
initServer();
start();