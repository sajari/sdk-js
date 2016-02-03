/*
 * api.js - The Sajari JavaScript API SDK
 */

var newquery = require("./query");
var url = require("./utils/url");

var request = require('superagent');
var jsonp = require('superagent-jsonp'); // To use jsonp chain: .use(jsonp)
var log = require('loglevel');

/*
 * Sajari Search API SDK
 * https://www.sajari.com/
 *
 * @param {string} company - Your company ID, see your dashboard
 * @param {string} collection - Your collection, see your dashboard
 * @param {Object} [opts] - Setup options, such as basicauth, jsonp, etc
 */
function API(company, collection, opts) {
	var usage = 'Usage: API(company, collection, opts)';

	if (!company) {
		log.error('Please provide a company ID. ' + usage);
		return
	}
	if (!collection) {
		log.error('Please provide a collection ID. ' + usage);
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

	this.se = 1;

	this.hosts = {
		api: "https://www.sajari.com/api/",
		index: "https://re.sajari.com"
	}

	log.info('API init done, %j', this);
}

API.prototype = {
	/*
	 * Search an index
	 */
	search: function(data, success, failure) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		if (typeof data === 'string') {
			if (data.indexOf('=') === -1) {
				// Data is a keyword query, change it accordingly
				data = {
					q: data
				};
			}
		}
		return this.send("search", opts, data);
	},

	/*
	 * Popular recommendations
	 */
	popular: function(data, success, failure) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("popular", opts, data);
	},

	/*
	 * Related recommendations
	 */
	related: function(data, success, failure) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("related", opts, data);
	},

	/*
	 * Recent recommendations
	 */
	recent: function(data, success, failure) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("recent", opts, data);
	},

	/*
	 * Best recommendations
	 */
	best: function(data, success, failure) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("best", opts, data);
	},

	/*
	 * Return a new query object
	 */
	query: function(opts) {
		return new newquery(opts);
	},

	/*
	 * Reset the query sequence (indicates a new query sequence is beginning)
	 */
	resetSequence: function() {
		this.se = 1;
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
			priority = url.decodeUriArgs(priority + '');
		}
		if (typeof secondary === 'string') {
			secondary = url.decodeUriArgs(secondary + '');
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
		data = this.mergeArgs(toArgs(data), {
			"company": this.company,
			"collection": this.collection
		});
		if (!data.hasOwnProperty('q.se') && path == 'search') {
			// There is no query sequence, so use the internal one an then increment
			data['q.se'] = this.se;
			this.se++;
		}

		var path = this.hosts.api + path;
		if (this.jsonp) {
			// Add the data to the JSONP URL destination
			path = url.augmentUri(path, data);
		}
		switch (opts.method) {
			case "POST":
				var req = request.post(path);
				break;
			case "GET":
				var req = request.get(path);
				break;
			case "PATCH":
				var req = request.patch(path);
				break;
			case "DELETE":
				var req = request.del(path);
				break;
			case "PUT":
				var req = request.put(path);
				break;
			default:
				return opts.failure();
		}

		// If basic auth is enabled, add it
		if (this.basicauth) {
			req.auth(this.basicauth.user, this.basicauth.pass);
		}

		// Add data to the req if we aren't using JSONP (which needs 
		// to be art of the URL, which was merged already above)
		if (this.jsonp) {
			req.use(jsonp);
		} else {
			req.send(data);
		}

		// Send the request and handle the response
		req.end(function(err, res) {
			if (err) {
				opts.failure();
			} else {
				opts.success(res.body);
			}
		})
	}
};

/**
 * Convert various objects into args for sending
 */
function toArgs(data) {
	if (data instanceof newquery) {
		data.sequence();
		data = data.encode();
	}
	return data
}

module.exports = API;
