/*
 * api.js - The Sajari JavaScript API SDK
 */

var query = require("./query");
var url = require("./website/utils/url");

var request = require('superagent');
var jsonp = require('superagent-jsonp'); // To use jsonp chain: .use(jsonp)
var debug = require('debug');
var error = debug('app:error');
var log = debug('app:log');

/*
 * Sajari Search API SDK
 * https://www.sajari.com/
 *
 * @param {string} company - Your company ID, see your dashboard
 * @param {string} collection - Your collection, see your dashboard
 * @param {Object} [opts]
 */
function API(company, collection, opts) {
  var usage = 'Usage: API(company, collection, opts)';

  if (!company) {
    error('Please provide a company ID. ' + usage);
    return
  }
  if (!collection) {
    error('Please provide a collection ID. ' + usage);
    return
  }
  this.company = company;
  this.collection = collection;

  opts = opts || {};
  for (var o in opts) {
    this[o] = opts[o];
  }
  if (this.jsonp === undefined) {
    this.jsonp = false;
  }

  this.query = new query();
  
  this.hosts = {
    api : "https://www.sajari.com/api/",
    index : "https://re.sajari.com"
  }

  log('API init done, %j', this);
}

API.prototype = {
  /*
   * Search 
   *
   */
  search: function(data, success, failure) {
    opts = {
      method : "POST",
      success: success,
      failure: failure,
    }
    this.query.se++;
    return this.send("search", opts, data);
  },

  /*
   * Popular recommendations
   *
   */
  popular: function(data, success, failure) {
    opts = {
      method : "POST",
      success: success,
      failure: failure,
    }
    return this.send("popular", opts, data);
  },

  /*
   * Related recommendations
   *
   */
  related: function(data, success, failure) {
    opts = {
      method : "POST",
      success: success,
      failure: failure,
    }
    return this.send("related", opts, data);
  },

  /*
   * Recent recommendations
   *
   */
  recent: function(data, success, failure) {
    opts = {
      method : "POST",
      success: success,
      failure: failure,
    }
    return this.send("recent", opts, data);
  },

  /*
   * Best recommendations
   *
   */
  best: function(data, success, failure) {
    opts = {
      method : "POST",
      success: success,
      failure: failure,
    }
    return this.send("best", opts, data);
  },



  /**
   * Send tracking data to a URL via an image request. Automatically adds extra arguments for identity, company, and collection.
   */
  pixel: function(data, path) {
    log("Pixel: " + data);
    var img = new Image();
    img.onerror = function() {
        log('Failed sending: ' + img.src);
    };
    img.onload = function() {
        log('Successful send: ' + img.src);
    };
    // Merge in the company and collection data
    data.company = this.company;
    data.collection = this.collection;

    if (path === undefined) {
      return
    }
    img.src = url.augmentUri(this.hosts.index + path, data);
  },

  /**
   * Merge two group of args, the "priority" object args will overwrite 
   * the "secondary" object args if there is a clash in keys. This also
   * supports url encoded strings, which are decoded into an object
   */
  mergeArgs: function(priority, secondary) {
    if (typeof priority === 'string') {
      priority = url.decodeUriArgs(priority +'');
    }
    if (typeof secondary === 'string') {
      secondary = url.decodeUriArgs(secondary+'');
    }
    for (var k in priority) {
        secondary[k] = priority[k];
    }
    return secondary
  },

  /**
   * Sends the API request and handles the response
   */
  send: function(path, opts, data) {
    // Merge in company and collection
    data = this.mergeArgs(data, {"company": this.company, "collection": this.collection, 'q.se': this.query.se});

    var path = this.hosts.api + path;
    if (this.jsonp) {
      // Add the data to the JSONP URL destination
      path = url.augmentUri(path, data);
    }
    switch(opts.method) {
      case "POST":
          var req = request.post(path);
          break;
      case "GET":
          var req = request.get(path);
          break;
      // TODO - What else? 
      default:
          return opts.failure();   
    }

    // If basic auth is enabled, add it
    if (this.basicauth) {
      req.auth(this.basicauth.user, this.basicauth.path);
    }

    // Add data to the req if we aren't using JSONP (which needs 
    // to be art of the URL, which was merged already above)
    if (this.jsonp) {
      req.use(jsonp);
    } else {
      req.send(data);
    }

    // Send the request and handle the response
    req.end(function(err, res){
      if (err) {
        opts.failure();
      } else {
        opts.success(res.body);
      }
    })
  }
};


module.exports = API; 
