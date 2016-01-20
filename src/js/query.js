
/**
 * Return a random string of length "len"
 */
function stringGen(len) {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}


/**
 * Query constructor
 */
function query(options) {
	this.options = options;
	if (this.options["q.se"] === undefined) {
		this.options["q.se"] = 0;
	}
	if (this.options["q.id"] === undefined) {
		this.options["q.id"] = stringGen(16);
	}
}

/**
 * Add prototype methods so queries can compile themselves
 */
query.prototype = {
	encode : function () {
		var input = (typeof this.options.q === 'string' ? this.options.q : '');
		
		var args = {};

		if (this.options.cols !== undefined) {
			args['cols'] = this.options.cols.join(',');
		}

		var argOptions = [
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
			'page',
			'q.id',
			'q.se'
		];
		for (var i = 0; i < argOptions.length; i++) {
	        if (this.options[argOptions[i]] !== undefined) {
	            args[argOptions[i]] = this.options[argOptions[i]];
	        }
		}

		if (this.options.filters !== undefined) {
			var filterArgs = [];
			for (var i = 0; i < this.options.filters.length; i++) {
				filterArgs.push(queryFilterArg(this.options.filters[i]));
			}
			if (filterArgs.length > 0) {
				args['filters'] = filterArgs.join('|');
			}
		}

		if (this.options.scales !== undefined) {
			var scaleArgs = [];
			for (var i = 0; i < this.options.scales.length; i++) {
				scaleArgs.push(queryScaleArg(this.options.scales[i]));
			}
			if (scaleArgs.length > 0) {
				args['scales'] = scaleArgs.join('|');
			}
		}

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
	qid : function (qid) {
		this.options["q.id"] = qid;
		return this;
	},

	/**
	 * Increment or set the query sequence
	 */
	sequence : function (seq) {
		if (seq !== undefined) {
			this.options["q.se"] = seq;
		} else {
			this.options["q.se"]++;
		}
		return this;
	},

	/**
	 * Define an array columns to return in the query
	 */
	cols : function (cols) {
		this.options.cols = cols;
		return this;
	},

	/**
	 * Add a URL to the query data (overrides when doing related)
	 */
	url : function (url) {
	    this.options.url = url;
	    return this;
	},

	/**
	 * Add a results page number to the query data
	 */
	page : function (num) {
	    this.options.page = num;
	    return this;
	},

	/**
	 * Define facet.fields and limit to return in the query
	 */
	facetfields : function (fields, limit) {
	    this.options["facet.fields"] = fields;
	    this.options["facet.limit"] = limit;
	    return this;
	},

	/**
	 * Define a metric facet to return in the query (only support one currently)
	 */
	metricfacet : function (field, start, end, gap) {
	    this.options["facet.metric.field"] = field;
	    this.options["facet.metric.start"] = start;
	    this.options["facet.metric.end"] = end;
	    this.options["facet.metric.gap"] = gap;
	    return this;
	},

	/**
	 * Define a date facet to return in the query (only support one currently)
	 */
	datefacet : function (start, end, gap) {
	    this.options["facet.date.start"] = start;
	    this.options["facet.date.end"] = end;
	    this.options["facet.date.gap"] = gap;
	    return this;
	},

	/**
	 * Define a filter for the query
	 */
	filter : function (key, op, value) {
		if (this.options.filters === undefined) {
			this.options.filters = [];
		}
		this.options.filters.push({ key: key, op: op, value: value });
		return this;
	},

	/**
	 * Define a scale for the query
	 */
	scale : function (key, centre, radius, start, finish) {
		if (this.options.scales === undefined) {
			this.options.scales = [];
		}
		this.options.scales.push({ key: key, centre: centre, radius: radius, start: start, finish: finish });
		return this;
	},

	/**
	 * Define an arbitrary attribute for the query
	 */
	attr : function (key, value) {
		if (this.options.attrs === undefined) {
			this.options.attrs = [];
		}
		this.options.attrs.push({ key: key, value: value });
		return this;
	}
}

module.exports = query;