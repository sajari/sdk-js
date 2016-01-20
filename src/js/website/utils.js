

var utils = {

	/**
	 * Convert a query string in to an object
	 */
	decodeUriArgs : function(queryStr) {
	    var args = {};
	    var a = queryStr.split('&');
	    for (var i in a) {
	        if (a.hasOwnProperty(i)) {
	            var b = a[i].split('=');
	            args[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
	        }
	    }
	    return args;
	},

	/**
	 * Convert an arguments object in to a query string
	 */
	encodeUriArgs : function(args) {
		var queryParts = [];
		for (var i in args) {
			queryParts.push(encodeURIComponent(i)+'='+encodeURIComponent(args[i]));
		}
		return queryParts.join('&');
	},

	/**
	 * Merges query strings or objects into a single query string. Accepts a variable number of query string/objects
	 * to merge. The latter overrides the former.
	 */
	mergeQueryStr : function(queryStr1) {
		var args = (typeof queryStr1 === 'string' ? this.decodeUriArgs(queryStr1) : queryStr1);
		for (var i = 1; i < arguments.length; i++) {
			if (arguments[i] !== undefined) {
				var nextArgs = (typeof arguments[i] === 'string' ? this.decodeUriArgs(arguments[i]) : arguments[i]);
				for (var a in nextArgs) {
					args[a] = nextArgs[a];
				}
			}
		}
		return this.encodeUriArgs(args);
	},

	/**
	 * Takes an existing URL and merges additional data into the query string
	 */
	augmentUri : function(uri, args) {
	  var m = /^([^\?]+)\?(.+)+$/.exec(uri);
	  if (m) {
	        return m[1]+'?'+this.mergeQueryStr(args, m[2]);
	  } else {
	        return uri+'?'+this.encodeUriArgs(args);
	    }
	}
}

module.exports = utils;