/*
 * grunt-init-rendr-react
 *
 * Copyright (c) 2013 Andrew Jones
 * Licensed under the MIT license.
 */

'use strict';

// Basic template description.
exports.description = 'Create a Rendr + React project, including unit tests.';

// Template-specific notes to be displayed after question prompts.
exports.after = 'You should now install project dependencies with _npm ' +
  'install_. After that, start your Rendr application with _grunt server_. ' +
  'Check out the Rendr documentation:' +
  '\n' +
  'https://github.com/airbnb/rendr' +
  '\n\n' +
  'React:' +
  '\n' +
  'http://facebook.github.io/react';

// Any existing file or directory matching this wildcard will cause a warning.
exports.warnOn = '*';

// The actual init template.
exports.template = function (grunt, init, done) {

  init.process({type: 'rendr'}, [
    // Prompt for these values.
    init.prompt('name'),
    init.prompt('description'),
    init.prompt('version'),
    init.prompt('author_name'),
    init.prompt('author_email'),
    init.prompt('author_url'),
    init.prompt('main', 'index.js'),
    init.prompt('node_version', '>= 0.8.0'),
    init.prompt('npm_test', 'mocha --ui bdd --reporter spec  ./test --recursive'),
    {
      name: 'rendr_api_host',
      message: 'The host API for your Rendr app'
    },
    {
      name: 'rendr_api_protocol',
      message: 'The protocol for the API',
      'default': 'https'
    }
  ], function (err, props) {
    props.keywords = [];
    props.dependencies = {
      "express": "~>3",
      "underscore": "~1.4.4",
      "async": "~0.1.22",
      "rendr-handlebars": "0.0.5",
      "rendr": "git://github.com/airbnb/rendr",
      "debug": "*"
    };
    props.devDependencies = {
      "grunt": "~0.4.1",
      "grunt-contrib-stylus": "~0.5.0",
      "grunt-contrib-uglify": "~0.2.2",
      "grunt-contrib-handlebars": "git://github.com/spikebrehm/grunt-contrib-handlebars#a4ae75750efeb23bf8ca9c61d9cf7569d40879fa",
      "grunt-rendr-stitch": "~0.0.6",
      "grunt-contrib-watch": "~0.3.1",
      "grunt-bg-shell": "~2.0.1",
      "nodemon": "~0.7.6",
      "mocha": "~1.9.0",
      "should": "~1.2.2",
      "grunt-react": "~0.3.0"
    };

    // Files to copy (and process).
    var files = init.filesToCopy(props);

    // Actually copy (and process) files.
    init.copyAndProcess(files, props);

    // Generate package.json file.
    init.writePackageJSON('package.json', props);

    // All done!
    done();
  });

};
