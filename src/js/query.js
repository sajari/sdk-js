var isArray = require('./utils/isArray');

/**
 * Query constructor
 */
function query(options) {
	options = options || {};
	this.options = options;
	if (this.se === undefined) {
		this.se = 0;
	}
	if (this.id === undefined) {
		this.id = stringGen(16);
	}
}

/**
 * Add prototype methods so queries can compile themselves
 */
query.prototype = {
	/**
	 * Encode the query into a set of params
	 */
	encode: function() {
		var args = {
			'q.id': this.id,
			'q.se': this.se
		};

		// Pass through specific args
		var argOptions = [
			'q',
			'url',
			'facet.fields',
			'facet.limit',
			'facet.metric.field',
			'facet.metric.start',
			'facet.metric.end',
			'facet.metric.gap',
			'facet.date.start',
			'facet.date.end',
			'facet.date.gap',
			'page'
		];
		for (var i = 0; i < argOptions.length; i++) {
			if (this.options[argOptions[i]] !== undefined) {
				args[argOptions[i]] = this.options[argOptions[i]];
			}
		}

		// Set the cols variable if applicable
		if (this.options.cols !== undefined) {
			args['cols'] = this.options.cols.join(',');
		}

		// Encode the filters
		if (this.options.filters !== undefined) {
			var filterArgs = [];
			for (var i = 0; i < this.options.filters.length; i++) {
				filterArgs.push(queryFilterArg(this.options.filters[i]));
			}
			if (filterArgs.length > 0) {
				args['filters'] = filterArgs.join('|');
			}
		}

		// Encode the scales
		if (this.options.scales !== undefined) {
			var scaleArgs = [];
			for (var i = 0; i < this.options.scales.length; i++) {
				scaleArgs.push(queryScaleArg(this.options.scales[i]));
			}
			if (scaleArgs.length > 0) {
				args['scales'] = scaleArgs.join('|');
			}
		}

		// Encode the meta and patch vars (i.e. associative array args)
		var aas = ['set', 'meta', 'delta', 'append'];
		for (var j in aas) {
			var k = aas[j];
			if (this.options[k] !== undefined) {
				for (var i = 0; i < this.options[k].length; i++) {
					if (isArray(this.options[k][i].value)) {
						args[k + '[' + this.options[k][i].key + ']'] = this.options[k][i].value.join(';');
					} else {
						args[k + '[' + this.options[k][i].key + ']'] = this.options[k][i].value;
					}
				}
			}
		}

		// Encode the other attributes
		if (this.options.attrs !== undefined) {
			for (var i = 0; i < this.options.attrs.length; i++) {
				args[this.options.attrs[i].key] = this.options.attrs[i].value;
			}
		}
		return args;
	},

	/**
	 * Define a unique query ID for the query
	 */
	setQueryId: function(qid) {
		this.id = qid;
		return this;
	},

	/**
	 * Increment or set the query sequence
	 */
	sequence: function(seq) {
		if (seq !== undefined) {
			this.se = seq;
		} else {
			this.se++;
		}
		return this;
	},

	/**
	 * Define an array columns to return in the query
	 */
	cols: function(cols) {
		this.options.cols = cols;
		return this;
	},

	/**
	 * Add a URL to the query data (overrides when doing related)
	 */
	url: function(url) {
		this.options.url = url;
		return this;
	},

	/**
	 * Add a results page number to the query data
	 */
	page: function(num) {
		this.options.page = num;
		return this;
	},

	/**
	 * Define facet.fields and limit to return in the query
	 */
	facetfields: function(fields, limit) {
		this.options["facet.fields"] = fields;
		this.options["facet.limit"] = limit;
		return this;
	},

	/**
	 * Define a metric facet to return in the query (only support one currently)
	 */
	metricfacet: function(field, start, end, gap) {
		this.options["facet.metric.field"] = field;
		this.options["facet.metric.start"] = start;
		this.options["facet.metric.end"] = end;
		this.options["facet.metric.gap"] = gap;
		return this;
	},

	/**
	 * Define a date facet to return in the query (only support one currently)
	 */
	datefacet: function(start, end, gap) {
		this.options["facet.date.start"] = start;
		this.options["facet.date.end"] = end;
		this.options["facet.date.gap"] = gap;
		return this;
	},

	/**
	 * Define a filter for the query
	 */
	filter: function(key, op, value) {
		if (this.options.filters === undefined) {
			this.options.filters = [];
		}
		this.options.filters.push({
			key: key,
			op: op,
			value: value
		});
		return this;
	},

	/**
	 * Define a scale for the query
	 */
	scale: function(key, centre, radius, start, finish) {
		if (this.options.scales === undefined) {
			this.options.scales = [];
		}
		this.options.scales.push({
			key: key,
			centre: centre,
			radius: radius,
			start: start,
			finish: finish
		});
		return this;
	},

	/**
	 * Define a meta parameter
	 */
	meta: function(key, value) {
		if (this.options.meta === undefined) {
			this.options.meta = [];
		}
		this.options.meta.push({
			key: key,
			value: value
		});
		return this;
	},

	/**
	 * Define an append parameter (this will be appended to the meta key, typically used for lists)
	 */
	append: function(key, value) {
		if (this.options.append === undefined) {
			this.options.append = [];
		}
		this.options.append.push({
			key: key,
			value: value
		});
		return this;
	},

	/**
	 * Define a delta parameter (if the meta is numeric, this is the delta change desired)
	 */
	delta: function(key, value) {
		if (this.options.delta === undefined) {
			this.options.delta = [];
		}
		this.options.delta.push({
			key: key,
			value: value
		});
		return this;
	},

	/**
	 * Define a set parameter (overwrites the existing meta key)
	 */
	set: function(key, value) {
		if (this.options.set === undefined) {
			this.options.set = [];
		}
		this.options.set.push({
			key: key,
			value: value
		});
		return this;
	},

	/**
	 * Decode fingerprint based responses. By default, fingerprints
	 * are zlib and base64 encoded to reduce transfer overhead. If
	 * decoded=true, the unencoded JSON will be returned instead
	 */
	decoded: function(state) {
		return this.attr('decoded', state);
	},

	/**
	 * Sets the maximum number of results to be returned. Can be combined
	 * with the page() to get sequential blocks of results back. Default is 10
	 */
	maxresults: function(num) {
		return this.attr('maxresults', num);
	},

	/**
	 * Define an arbitrary attribute for the query
	 */
	attr: function(key, value) {
		if (this.options.attrs === undefined) {
			this.options.attrs = [];
		}
		this.options.attrs.push({
			key: key,
			value: value
		});
		return this;
	}
}

/**
 * Compile a filter argument for a query
 */
function queryFilterArg(filter) {
	switch (filter.op) {
		case '>':
		case '<':
		case '<=':
		case '>=':
		case '^':
		case '$':
		case '!=':
		case '~':
			break;
		case 'starts-with':
			filter.op = '^';
			break;
		case 'ends-with':
			filter.op = '$';
			break;
		case 'contains':
			filter.op = '~';
			break;
		default:
			filter.op = '';
	}
	if (typeof filter.key != 'string') {
		throw 'Invalid Sajari filter key: (' + (typeof filter.key) + ') ' + filter.key;
	}
	if (filter.op === '') {
		return filter.key + ',' + queryValue(filter.value);
	} else {
		return filter.op + filter.key + ',' + queryValue(filter.value);
	}
}

/**
 * Compile a scale argument for a query
 */
function queryScaleArg(scale) {
	if (typeof scale.key != 'string') {
		throw 'Invalid Sajari scale key: (' + (typeof scale.key) + ') ' + scale.key;
	}
	if (scale.center !== undefined) {
		scale.centre = scale.center;
	}
	return scale.key + ',' + queryNumericValue(scale.centre) + ',' + queryNumericValue(scale.radius) + ',' + queryNumericValue(scale.start) + ',' + queryNumericValue(scale.finish);
}

/**
 * Returns the numeric UTC unix timestamp for a javascript date
 */
function timestamp(date) {
	return Math.round((date.valueOf() + (new Date().getTimezoneOffset())) / 1000);
}

/**
 * Returns a value suitable for a query, or throws an error
 */
function queryValue(value) {
	if (Object.prototype.toString.call(value) === '[object Date]') {
		return timestamp(value);
	} else if (typeof value != 'string' && typeof value != 'number') {
		throw 'Invalid Sajari query value: (' + (typeof value) + ') ' + value;
	} else {
		return '' + value;
	}
}

/**
 * Returns a numeric value suitable for a query, or throws an error
 */
function queryNumericValue(value) {
	if (Object.prototype.toString.call(value) === '[object Date]') {
		return timestamp(value);
	} else if (typeof value != 'number') {
		throw 'Invalid Sajari query numeric value: (' + (typeof value) + ') ' + value;
	} else {
		return value;
	}
}

/**
 * Return a random string of length "len"
 */
function stringGen(len) {
	var text = "";
	var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < len; i++)
		text += charset.charAt(Math.floor(Math.random() * charset.length));
	return text;
}

module.exports = query;
