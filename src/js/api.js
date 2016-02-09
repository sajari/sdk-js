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
		// Merge in company and collection
		data = this.mergeArgs(toArgs(data), {
			"company": this.company,
			"collection": this.collection
		});

		var img = new Image();
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
	 * Fingerprint a document or input string. Meta is also commonly part
	 * of fingerprint creation, e.g. setting a "title", etc.
	 */
	fingerprint: function(data, success, failure) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("fingerprint", opts, data);
	},

	/**
	 * Resets learning weightings on an encoded input fingerprint.
	 */
	fingerprintReset: function(fingerprint, success, failure) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		if (typeof data !== 'string') {
			log.error("Fingerprint should be a string")
		}
		var data = {
			'fingerprint': fingerprint
		};
		return this.send("fingerprint/reset", opts, data);
	},

	/**
	 * Indicate good and bad results for a particular fingerprint. This will 
	 * adjust word weightings and return a new fingerprint with these adjustments
	 * Weighting is a very quick way to move search results towards the searchers
	 * chosen context. 
	 */
	fingerprintWeight: function(fingerprint, docId, pos, neg) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		if (typeof data !== 'string') {
			log.error("Fingerprint should be a string")
		}
		var data = {
			'fingerprint': fingerprint
		};
		return this.send("fingerprint/weight/" + docId + "/" + pos + "/" + neg, opts, data);
	},

	/**
	 * Add a document/object to the collection
	 */
	add: function(query) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("add", opts, data);
	},

	/**
	 * Retrieve a document/object using its Sajari ID
	 */
	getById: function(docId) {
		if (typeof docId !== 'string') {
			log.error("docId should be a string. If using a unique meta key, use the get(data) function instead.");
		}
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("get/" + docId, opts, null);
	},

	/**
	 * Retrieve a document/object using a unique meta key (the field 
	 * must be flagged as unique in your console). 
	 * @param data - can be a query or an object
	 */
	get: function(data) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("get", opts, data);
	},

	/**
	 * Places a document at a specific document ID slot. This should
	 * normally not be used unless recovering from an outage where
	 * an external reference to the Sajari ID must be maintained. We 
	 * don't recommend doing that. Deprecated.
	 * @param data - can be a query or an object
	 */
	put: function(docId, data) {
		if (typeof docId !== 'string') {
			log.error("docId should be a string.");
		}
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("put/" + docId, opts, data);
	},

	/**
	 * Patch a document/object using its Sajari ID
	 * @param data - can be a query or an object, typically it would be a
	 * query, which handles "set", "delta", "append", etc.
	 */
	patchById: function(docId, data) {
		if (typeof docId !== 'string') {
			log.error("docId should be a string. If using a unique meta key, use the patch(data) function instead.");
		}
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("patch/" + docId, opts, null);
	},

	/**
	 * Patch a document/object using a unique meta key (the field 
	 * must be flagged as unique in your console). 
	 * @param data - can be a query or an object, typically it would be a
	 * query, which handles "set", "delta", "append", etc.
	 */
	patch: function(data) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("patch", opts, data);
	},

	/**
	 * Remove a document/object using its Sajari ID
	 */
	removeById: function(docId) {
		if (typeof docId !== 'string') {
			log.error("docId should be a string. If using a unique meta key, use the remove(data) function instead.");
		}
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("remove/" + docId, opts, null);
	},

	/**
	 * Remove a document/object using a unique meta key (the field 
	 * must be flagged as unique in your console). 
	 * @param data - can be a query or an object
	 */
	remove: function(data) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("remove", opts, data);
	},

	/**
	 * Replace a document/object using its Sajari ID
	 * @param data - can be a query or an object, typically it would be a
	 * query
	 */
	replaceById: function(docId, data) {
		if (typeof docId !== 'string') {
			log.error("docId should be a string. If using a unique meta key, use the patch(data) function instead.");
		}
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("replace/" + docId, opts, null);
	},

	/**
	 * Replace a document/object using a unique meta key (the field 
	 * must be flagged as unique in your console). 
	 * @param data - can be a query or an object, typically it would be a
	 * query, which handles "set", "delta", "append", etc.
	 */
	replace: function(data) {
		opts = {
			method: "POST",
			success: success,
			failure: failure,
		}
		return this.send("replace", opts, data);
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
				opts.failure(err);
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
		return data
	}
	if (typeof data === 'string') {
		if (data.indexOf('=') === -1) {
			return {
				q: data
			};
		}
	}
	return data
}

module.exports = API;
