var _ = require('lodash');
var async = require('async');
var path = require('path');

var Registry = function() {
  this.order = [];
};

Registry.prototype = {
  add: function(label, fn) {
    this.order.push({
      name: label,
      fn: fn
    });
  },

  before: function(beforeLabel, label, fn) {
    var beforeIndex = _.findIndex(this.order, function(o) {
      return o.name == beforeLabel;
    });
    if (beforeIndex === -1) {
      return console.log(
        'Cannot register',
        label,
        '.',
        beforeLabel,
        'not found'
      );
    }
    this.order.splice(beforeIndex, 0, {
      name: label,
      fn: fn
    });
  },

  after: function(afterLabel, label, fn) {
    var afterIndex = _.findIndex(this.order, function(o) {
      return o.name == afterLabel;
    });
    if (afterIndex === -1) {
      return console.log(
        'Cannot register',
        label,
        '.',
        afterLabel,
        'not found'
      );
    }
    this.order.splice(afterIndex + 1, 0, {
      name: label,
      fn: fn
    });
  }
};

var Executer = function(verbose) {
  this.plugins = {};
  this.verbose = verbose;
};

Executer.prototype = {
  execute: function(plugins, disablePlugins, args, cb) {
    // require all plugins. Plugin functions are cached
    // across builds.
    this.requirePlugins(plugins);

    // create new registry object that each plugin calls
    // to register itself.
    var registry = new Registry();

    // loop through and instantiate each plugin, passing in
    // the registry object.
    _.each(
      plugins,
      _.bind(function(plugin) {
        if (this.plugins[plugin]) {
          new this.plugins[plugin](registry);
        }
      }, this)
    );

    // remove disabled plugins by removing all labels that start
    // with the plugin name.
    var enabled = _.filter(registry.order, function(o) {
      return _.indexOf(disablePlugins, o.name.split(':')[0]) == -1;
    });

    // log the order of all plugins.
    if (this.verbose) {
      console.log('Plugin order:');
      _.each(enabled, function(o, i) {
        console.log(i + 1 + '. ' + o.name);
      });
    }

    // create an async waterfall chain from the registry order.
    var chain = _.map(enabled, function(o) {
      return o.fn;
    });

    // add a function to kick off the chain, passing the args
    chain.unshift(function(callback) {
      args.unshift(null);
      callback.apply(this, args);
    });

    // run the all functions, one after the other.
    async.waterfall(chain, function(err, config, stream, extras) {
      cb(config, stream, extras);
    });
  },

  // File loading
  // ------------------------------------------------

  requirePlugins: function(plugins) {
    _.each(
      plugins,
      _.bind(function(plugin) {
        if (!this.plugins[plugin]) {
          this.plugins[plugin] = this.requirePlugin(plugin);
        }
      }, this)
    );
  },

  requirePlugin: function(file) {
    var loadedFile;

    // try to load the file as a local file
    try {
      loadedFile = require(path.join(__dirname, 'plugins', file));
    } catch (e1) {
      if (e1 instanceof SyntaxError) {
        console.log(
          'Plugin file: ' + file + ' has syntax errors. ' + e1.toString()
        );
      } else {
        // try to load the file as a file in the book
        try {
          loadedFile = require(path.join(process.cwd(), file));
        } catch (e2) {
          if (e2 instanceof SyntaxError) {
            console.log(
              'Plugin file: ' + file + ' has syntax errors. ' + e2.toString()
            );
          } else {
            // try to load the file as a node module installed in book folder
            try {
              loadedFile = require(path.join(
                process.cwd(),
                'node_modules',
                file
              ));
            } catch (e3) {
              console.log(e3);
              if (e3 instanceof SyntaxError) {
                console.log(
                  'Plugin file: ' +
                    file +
                    ' has syntax errors. ' +
                    e3.toString()
                );
              } else {
                console.log('Required file: ' + file + ' cannot be found');
              }
            }
          }
        }
      }
    }

    return loadedFile;
  }
};

module.exports = Executer;
