

var url = {

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
	},

	/**
	 * Append a query parameter to an existing URL string.
	 * Optionally put it at the start with "atStart"
	 */
	addParameter : function(url, parameterName, parameterValue, atStart){
	    var replaceDuplicates = true;
	    var urlhash = '';
	    if(url.indexOf('#') > 0){
	        var cl = url.indexOf('#');
	        urlhash = url.substring(url.indexOf('#'),url.length);
	    } else {
	        urlhash = '';
	        var cl = url.length;
	    }
	    var sourceUrl = url.substring(0,cl);

	    var urlParts = sourceUrl.split("?");
	    var newQueryString = "";

	    if (urlParts.length > 1)
	    {
	        var parameters = urlParts[1].split("&");
	        for (var i=0; (i < parameters.length); i++)
	        {
	            var parameterParts = parameters[i].split("=");
	            if (!(replaceDuplicates && parameterParts[0] == parameterName))
	            {
	                if (newQueryString == "")
	                    newQueryString = "?";
	                else
	                    newQueryString += "&";
	                newQueryString += parameterParts[0] + "=" + (parameterParts[1]?parameterParts[1]:'');
	            }
	        }
	    }
	    if (newQueryString == "")
	        newQueryString = "?";

	    if(atStart){
	        newQueryString = '?'+ parameterName + "=" + parameterValue + (newQueryString.length>1?'&'+newQueryString.substring(1):'');
	    } else {
	        if (newQueryString !== "" && newQueryString != '?')
	            newQueryString += "&";
	        newQueryString += parameterName + "=" + (parameterValue?parameterValue:'');
	    }
	    return urlParts[0] + newQueryString + urlhash;
	},

	/**
	 * Get a parameter from the URL
	 */
	getURLParameter : function(name) {
	    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	}
}

module.exports = url;