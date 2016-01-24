var isArray = require('lodash.isarray');
require("./utils/polyfills")

var loaded = require("./utils/loaded");
var url = require("./utils/url");
var profile = new (require("./profile"))();
var API = require("./../api");
var query = require("./../query");
var renderResults = require("./views/results");


var opts = {
    cssUrl : 'https://www.sajari.com/css/sj.css', // Default styling if desired
    prefix : 'data-sj-',        // Elements with Sajari data parameters all use this as a prefix
    autoFlush: 100,             // Flush the stack array queue automatically X msecs. 0 is no auto-flush
    debug : false,               // If true, debug information will be logged to the console
    company : undefined,
    collection: undefined,
    cssIncluded: false,         // If false, the Sajari CSS will be loaded. This can be overridden by setting to true
    indexed : false,            // Whether or not the index call has already been sent
    scanOnLoad : true,          // Scans the DOM and builds a list of nodes with domTargets related tags
    autoQuery : false,          // If true, "q" in the URL will automatically trigger a query
    autoQueryParam : "q",       // If autoQuery is true, this is the search query parameter to look for in the URL
    currentQuery : "",
    domTargets : [
        'company', 'collection', 'profile-id', 'noindex', 'noprofile', 'profile-delay', 'conv-type',
        'search-query', 'search-query-word', 'search-query-go', 'search-results', 'recent', 'popular',
        'related', 'best', 'search-recent', 'search-noresults', 'search-error', 'personalization'
    ]
}
// Initialize DOM functionality
var dom = new (require("./utils/dom"))(opts);

// Keep information on the current webpage
var page = {
    Id : undefined
}

// function stack queue
var stack = []; 

// We define this to make it global to this module, it will be initialized later on install.
var api = undefined; 


/**
 * Process an array or object of options
 */
function processOptions(options) {
    if (isArray(options)) {
    	for (var i = 0; i < options.length; i++) {
    		stack.push(options[i]);
    	}
    } else if (typeof options === 'object') {
    	for (var i in options) {
    		var opt = (isArray(options[i]) ? options[i].slice() : [options[i]]);
    		opt.unshift(i);
    		stack.push(opt);
    	}
    }
    flush();
}

/**
 * Safely log an error message to the console if in debug mode
 */
function log(text) {
    if (opts.debug) {
        console.log(text);
    }
}

/**
 * Flush the stack array
 */
function flush() {
	var r;
	while (r = stack.shift()) {
		var fn = r.shift();
		if (methods[fn] !== undefined) {
			methods[fn].apply(undefined, r);
		}
	}
    if (opts.autoFlush > 0) {
        setTimeout(flush, opts.autoFlush);
    }
}

/**
 * Render the results into the page
 */
function showResults(response, renderNode, renderType) {

    // Clear errors
    if (dom.firstNode('search-error') !== undefined) {
        dom.firstNode('search-error').style.display = 'none';
    }

    var res = response.response;

    // Setup defaults
    res.showThumb = false;
    res.showDesc = true;
    res.showUrl = false;
    res.renderSearch = true;
    res.formattedMsecs = 0.000;
    res.showMeta = [];

    // Handle formatting options
    var dynAttributes = dom.dynamicAttrs(renderNode);
    for (var key in dynAttributes) {
        if (dynAttributes.hasOwnProperty(key)) {
            if (key == "thumbnail") {
                res.showThumb = true;
            }
            if (key == "hidedesc") {
                res.hideDesc = true;
            }
            if (key == "showmeta") {
                res.showMeta = dynAttributes[key].split(/\s*,\s*/);
            }
        }
    }

    // Timing formatting
    if (response.msecs) {
        res.formattedMsecs = parseFloat(response.msecs/1000).toFixed(3);
    }

    // Was the query a fuzzy match or autocomplete?
    if (res.fuzzy) {
        for(var i in res.fuzzy){
            res.fuzzyStr = res.fuzzy[i]; 
            break
        }
    }

    // Add the renderType so we can differentiate search and recommendations
    res.renderType = renderType;

    // Add tracking information to each result so clicks are handled:
    // TODO
    // .onmousedown
    // TODO
    // .trackingUrl

    // Render it
    renderNode.innerHTML = renderResults(res);
}

function showError(renderNode) {
    if (!dom.hasNode('search-results') || !dom.hasNode('search-error')) {
        // Put the error message in the results area if it used the overlay or they don't have an error node
        renderNode.innerHTML = '<p class="sj-error">Oops! An error occured while searching. Please try again.</p>';
    } else if (dom.firstNode('search-error') !== undefined) {
        dom.firstNode('search-error').style.display = 'block';
    }
}

/**
 * Render a modal overlay and return a reference to the modal contents container
 */
function overlay(attrs) {
    log(attrs);
    var resultsextra = "";
    var themecolor = "blue";
    if (typeof attrs === 'object') {
        for (var key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                // Pass any relevant parameters to the modal results
                resultsextra += " " + opts.prefix + key + "=" + attrs[key];
                if (key == "theme") {
                    themecolor = attrs[key];
                }
            }
        }
    }
    if (overlayDom === undefined) {
        overlayDom = document.createElement('div');
        overlayDom.style.display = 'none';
        overlayDom.className = 'sj-search';
        overlayDom.innerHTML = '<div class="sj-shade"></div>'
                             + '<div class="sj-search-modal sj-cf">'
                             +   '<div class="sj-close">&times;</div>'
                             +   '<form class="sj-search-form">'
                             +      '<div id="sj-search-bar">'
                             +          '<span id="sj-icon-search"></span><input type="search" placeholder="search this site" />'
                             +          '<button type="submit" class="sj-search-go ' + themecolor + '">Search</button>'
                             +      '</div>'
                             +   '</form>'
                             +   '<div class="sj-results"' + resultsextra + '></div>'
                             + '</div>';
        document.body.appendChild(overlayDom);
        bind(overlayDom.lastChild.firstChild, 'click', function() {
            this.parentNode.parentNode.style.display = 'none';
        });
        bind(overlayDom.firstChild, 'click', function() {
            this.parentNode.style.display = 'none';
        });

        installSearchGo(
            overlayDom.lastChild.childNodes[1].lastChild.lastChild,
            installSearchQuery(overlayDom.lastChild.childNodes[1].firstChild.childNodes[1])
        );
        if (firstNode('search-query') !== undefined) {
            domNodes['search-query'].push(overlayDom.lastChild.childNodes[1].firstChild.childNodes[1]);
        }
    } else {
        overlayDom.lastChild.lastChild.innerHTML = '';
    }
    if (typeof attrs === 'object') {
        var query = overlayDom.lastChild.childNodes[1].firstChild.childNodes[1];
        
        // Clear attributes
        for (var i = 0; i < query.attributes.length; i++) {
            var attrib = query.attributes[i];
            if (attrib.specified) {
                if (attrib.name.substr(0,8) === 'data-sj-') {
                    query.removeAttribute(attrib.name);
                }
            }
        }
        
        // Set attributes
        for (var j in attrs) {
            query.setAttribute('data-sj-'+j, attrs[j]);
        }
    }

    overlayDom.style.display = 'block';
    return overlayDom.lastChild.lastChild;
}

/**
 * Calls the built in search using the queries identified by attributes, and the display the results in an overlay
 * if no elements with attributes exist.
 */
function builtInSearch() {
    var searchInProgress = false;
    var node = this,
        last = this.value;

    // Propagate dynamic attributes from one set of elements to another
    // In this case people tend to configure the search query element, but
    // some properties need to enact on the results element.
    dom.copyDynamicProperties('search-query', 'search-results');

    // Find and Install the Search Results DIV. If it does not exist, create an overlay block to handle results instead
    dom.resultsNode = (dom.hasNode('search-results') ? dom.firstNode('search-results') : overlay(dom.dynamicAttrs(this)));

    // If we're already waiting on a search, exit here, no point starting another
	if (searchInProgress) {
		return;
	}

    // Start the search process
	searchInProgress = true;
    SJ.Search(
        this.value.replace(/(^ *| *$)/, ''),
        function (response) {
			searchInProgress = false;
            showResults(response, dom.resultsNode, "search");
            if (node.value !== last && hasInstantSearch(node)) {
            	builtInSearch.apply(node);
            }
        },
        function () {
			searchInProgress = false;
            showError(dom.resultsNode);
        },
        dom.dynamicAttrsUri(this)
    );

    // Keep the query global so we don't need to keep searching for it
    opts.currentQuery = node.value;

    // Propagate the query to other query elements
    dom.eachNode('search-query', function (otherNode) {
        if (node !== otherNode) {
            otherNode.value = node.value;
        }
    });
}

/**
 * Install a search query input element
 */
function installSearchQuery(node) {

    // Run the search if they press enter on the input field
    dom.bind(node, 'keydown', function(e) {
        if (e.keyCode === 13) {
            builtInSearch.apply(this);
            if (e.preventDefault !== undefined) {
                e.preventDefault();
            }
        }
    });

    // Keep search queries in sync
    dom.bind(node, 'change', function () {
        dom.eachNode('search-query', function (otherNode) {
            if (node !== otherNode) {
                otherNode.value = node.value;
            }
        });
    });

    // Auto query if "q" parameter exists in URL
    if (opts.autoQuery) {
        var auto = url.getURLParameter(opts.autoQueryParam);
        if (auto) {
            node.value = auto
            builtInSearch.apply(node);
        }
    }

	// Install instant search if applicable
	if (hasInstantSearch(node)) {
		dom.bind(node, 'keyup', function(e) {
			if (e.keyCode > 32 || e.keyCode === 8 || e.keyCode === 16) { // > space, or backspace, or delete
				builtInSearch.apply(this);
			}
		});
	}

    return node;
}

/**
 * Returns true if the node has instant searching turned on
 */
function hasInstantSearch(node) {
	var dynAttributes = dom.dynamicAttrs(node);
	for (var key in dynAttributes) {
		if (dynAttributes.hasOwnProperty(key)) {
			if (key == "search-query-instant") {
				return true;
			}
		}
	}
	return false;
}

/**
 * Install a search GO button element
 */
function installSearchGo(node, queryInput) {
    dom.bind(node, 'click', function(e) {
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
        builtInSearch.apply(queryInput ? queryInput : dom.firstNode('search-query'));
    });
    return node;
}

/**
 * Extend the query object to support running it
 */
query.prototype.run = function(success, failure) {
    if (this.options.func !== undefined) {
        
        if (this.options.q === undefined) {
            this.options.q = "";
        }

        switch(this.options.func) {
            case "search":
                SJ.Search(this.options.q, success, failure, this.encode());
                break;
            case "best":
                SJ.Best(success, failure, this.encode());
                break;
            case "popular":
                SJ.Popular(success, failure, this.encode());
                break; 
            case "recent":
                SJ.Recent(success, failure, this.encode());
                break; 
            case "related":
                SJ.Related(success, failure, this.encode());
                break; 
        }
    }
}

/**
 * Methods is a collection of functions that can be pushed onto the stack queue
 */
var methods = {
    /**
     * Send free "text" and meta information into the current person's profile
     */
    profile: function(text, meta) {
        // Add new meta to the user profile
        for (var key in meta) {
            profile.meta[key] = meta[key];
        }
        log(profile);

        var metaToSend = {};

        // Merge in profile meta
        for (var key in profile.meta) {
            metaToSend["meta["+key+"]"] = profile.meta[key];
        }
        metaToSend['profile.text'] = text + '';
        metaToSend['p.ga'] = profile.gaId;
        metaToSend['p.id'] = profile.visitorId;

        api.pixel(metaToSend, '/stats/profile');
    },

    // Set a new visitor ID
    profileid: function(id) {
        profile.setVisitorId(id);
    },

    // Send a conversion with the given type and value
    conversion: function(type, value) {
        if (value === null || value === undefined) {
            value = 0;
        }
        api.pixel({
            'cv.t': type + '',
            'cv.v': value + '',
            'p.ga': profile.gaId,
            'p.id': profile.visitorId
        }, '/stats/conversion');
    },

    // Track a click through for a given "qid"
    click: function(qid, slot, injected) {
        if (injected === undefined) {
            injected = '';
        }
        SJ.SendClick(qid, slot, injected, undefined);
    },

    // Index the page
    index: function() {
        if (opts.indexed) {
            log('Already indexed');
            return;
        }
        opts.indexed = true;
        api.pixel({
            'ec.ti': document.title,
            'ec.de': dom.getMeta("description"),
            'ec.ke': dom.getMeta("keywords"),
            'e.id': document.URL,
            'cc.co': opts.company,
            'cc.pr': opts.collection,
            'p.ga': profile.gaId,
            'p.id': profile.visitorId
        }, '');
    },

    // Prevent page indexing
    noindex: function() {
        opts.indexed = true;
    },

    // Automatic query from url support
    urlquery: function() {
        opts.autoQuery = true;
    },

    // Prevent CSS from loading
    nocss: function() {
        opts.cssIncluded = true;
    },

    // Prevent profiling
    noprofile: function() {
        profile.sent = true;
    },

    // Set the collection
    collection: function(newCollection) {
        opts.collection = newCollection + '';
    },

    // Set the company
    company: function(newCompany) {
        opts.company = newCompany + '';
    },

    // Don't scan the page when the script loads
    // Use if performance is a problem or you want to call SJ.Scan() later
    'no-scan': function() {
        opts.scanOnLoad = false;
    },

    // Turn debugging on and off
    debug: function(enabled) {
        opts.debug = (enabled ? true : false);
    },

    // Open an empty overlay. For use with applications that do not have a search box, but trigger
    // a search with a button click or similar
    overlay: function(attrs) {
        overlay(attrs);
    }

};


// The SJ object is exported
var sj = function (options) {
	processOptions(options);
	return this;
};

/**
 * Send a search to the API with the provided keywords. Calls the successCallback with the response, or the
 * failureCallback if it failed. A response with no response is considered a success, albeit empty.
 */
sj.prototype = {
	Search : function(keywords, success, failure, dynamicArgs) {

		var data = {
			'q': keywords,
			'p.id': profile.visitorId,
			'q.id': api.query.id,
		};
		if (dom.hasNode('personalization')) {
			data['profile.query'] = 'true';
			data['personalization'] = 'true';
		}
		if (dom.hasNode('search-recent')) {
			data['recent'] = 'true';
		}
        if (dom.hasNode('local')) {
            data['local'] = 'true';
        }

        api.search(api.mergeArgs(data, dynamicArgs), success, failure);
	},

	Popular : function(success, failure, dynamicArgs) {
		var uri = 'popular';

		if (dynamicArgs !== undefined) {
			uri += '?'+dynamicArgs;
		}

        api.popular(api.mergeArgs({}, dynamicArgs), success, failure);
	},

	Recent : function(success, failure, dynamicArgs) {
		var uri = 'recent';

		if (dynamicArgs !== undefined) {
			uri += '?'+dynamicArgs;
		}
        
        api.recent(api.mergeArgs({}, dynamicArgs), success, failure);
	},

	Related : function(success, failure, dynamicArgs) {
		var data = {
			'url': location.href,
			'title': document.title,
			'description': dom.getMeta("description")
		};
        
        api.related(api.mergeArgs(data, dynamicArgs), success, failure);
	},

	Autocomplete : function(keywords, success, failure) {
	    var data = {
	        'q': keywords
	    };
        
        api.autocomplete(data, success, failure);
	},

	Best : function(success, failure, dynamicArgs) {
		var data = {
			'p.id': profile.visitorId
		};
        
        api.best(api.mergeArgs(data, dynamicArgs), success, failure);
	},

/* USED FOR A JQIERY PLUGIN, MIGHT WANT TO DITCH???
	__installInput : function (node) {
		installSearchQuery(node);
		if (domNodes['search-query'] === undefined) {
			domNodes['search-query'] = [];
		}
	    domNodes['search-query'].push(node);
	},

	__installGo : function (node) {
		installSearchGo(node)
	},
*/

	Install : function (options) {
        var options = options || {};

        // Reset and re-scan our components in the DOM
        // Because we are scanning, we need to reset our current shadow DOM
        // That means dynamic props will possibly need to be recopied...
        this.dynPropCopied = false;
        dom.Nodes = {}; // We reset externally as the scanShim function is recursive
        dom.scanShim(document.body);

		processOptions(options);

        // DOM elements can be used to specify a company and collection
		opts.company = dom.firstNodeVal('company', opts.company);
		opts.collection = dom.firstNodeVal('collection', opts.collection);
		
		if (opts.company === undefined || opts.collection === undefined) {
            log("company and collection cannot be undefined...");
			return;
		}

        // We have a company and a domain so we can install the API
        api = new API(opts.company, opts.collection, { jsonp : true});

		// Profile user unless we specify not to
        // To do: This should set the opts var accordingly
		if (!dom.hasNode('noprofile')) {
			// Send the document title to profile
	        if (!profile.sent) {
	            setTimeout(function() {
	                stack.push(['profile', document.title]);
	                flush();
	            }, dom.firstNodeVal('profile-delay', profile.defaultDelay));
	        }
			

			// Add click handlers to anchor tags to profile. This means
            // link anchor text is used to help profile what users are
            // interested in. 
			var a = document.getElementsByTagName('a');
			for (var i = 0; i < a.length; i++) {
				if (/^#/.test(a[i].getAttribute('href') + '')) {
					dom.bind(a[i], 'mousedown', function() {
						stack.push(['profile', (this.innerText === undefined ? this.textContent : this.innerText)]);
						flush();
					});
				}
			}
		}

		// Send page for indexing
		if (!dom.hasNode('noindex')) {
			stack.push(['index']);
		}

		// Send conversions. We push onto the stack as the API is still initializing
		dom.eachNode('conv-type', function(node, attr) {
			stack.push(['conversion', node.getAttribute(attr), node.getAttribute(opts.prefix + 'conv-val')]);
		});

		// Send click throughs. We push onto the stack as the API is still initializing
		var qid = url.getURLParameter("q.id");
		if (qid) {
			stack.push(['click', qid, url.getURLParameter("q.sl"), url.getURLParameter("q.in")]);
		} 

        // Flush our stack in case settings impact the install of components
		flush();

        // If required, we need to include Sajari CSS into the DOM
        if (!opts.cssIncluded) {
            dom.importCss(opts.cssUrl);
        }

        // SETUP RECOMMENDATIONS
		// Popular
		if (dom.hasNode('popular')) {
			SJ.Popular(
				function (response) {
					showResults(response, dom.firstNode('popular'), "popular");
				},
				function () {},
				dom.dynamicAttrsUri(dom.firstNode('popular'))
			);
		}

		// Recent
		if (dom.hasNode('recent')) {
			SJ.Recent(
				function (response) {
					showResults(response, dom.firstNode('recent'), "recent");
				},
				function () {},
				dom.dynamicAttrsUri(dom.firstNode('recent'))
			);
		}

		// Related
		if (dom.hasNode('related')) {
			SJ.Related(
				function (response) {
					showResults(response, dom.firstNode('related'), "related");
				},
				function () {},
				dom.dynamicAttrsUri(dom.firstNode('related'))
			);
		}

		// Best
		if (dom.hasNode('best')) {
			SJ.Best(
				function (response) {
					showResults(response, dom.firstNode('best'), "best");
				},
				function () {},
				dom.dynamicAttrsUri(dom.firstNode('best'))
			);
		}

        // SETUP SEARCH
		// Setup the search query process based on the options available.
        // We need to check the scanned DOM nodes to see what is required.
		dom.resultsNode = undefined; // Reset the results node.
		dynPropCopied = false;
		if (!dom.hasNode('search-query')) {
            return
        }

        // We have search query nodes, so install event handlers accordingly
		dom.eachNode('search-query', function (node) {
			installSearchQuery(node);
		});

        // Check for a search button, if exists, bind our search func to it
		if (dom.hasNode('search-query-go')) {
			dom.eachNode('search-query-go', function (node) {
				installSearchGo(node);
			});
		} 

        // There is not a search button, so we need other events to 
        // to trigger searches accordingly
        if (dom.hasNode('search-results')) {

			// If there isn't a go button and they have defined a place for results
			dom.eachNode('search-query', function (node) {

				// Run the search if they put in a space character
				if (dom.hasNode('search-query-word')) {
					dom.bind(node, 'keyup', function(e) {
						if (e.keyCode === 32) {
							builtInSearch.apply(this);
						}
					});
				}

				// Run the search if they change the input field
				dom.bind(node, 'change', builtInSearch);
			});
		}
	},

	/**
	 * Mimics the behaviour of the _sj global variable
	 */
	push : function (value) {
		stack.push(value);
	},

	SendClick : function(qid, slot, injected, node) {
	    var u = "";
	    if (node !== undefined) {
	        u = node.getAttribute('href') // This is a mousedown event
	    } else {
	        u = window.location.href // No node, this must be the destination page
	    }
	    api.pixel({
	        'p.ga':profile.gaId,
	        'p.id':profile.visitorId,
	        'q.id':qid,
	        'q.sl':slot,
	        'q.in':injected,
	        'q.de':u
	    }, '/stats/click');
	},

	/**
	 * Start a new query
	 */
	Query : function (options) {
		if (typeof options === 'string') {
			options = { q : options };
		} else if (typeof options !== 'object') {
			options = {};
		}
	    options.func = "search";
		return (new query(options));
	},

	/**
	 * Start a new recommendation
	 */
	Recommend : function (options) {
	    if (typeof options === 'string') {
	        options = { func : options };
	    } else if (typeof options !== 'object') {
	        options = {};
	    }
	    return (new query(options));
	}
};

// Start scanning automatically
var SJ = new sj();
(function() {
    loaded(window, function(){
    	/**
		 * Import existing _sj global variable if it exists
		 */
		if (window._sj !== undefined && isArray(window._sj)) {
			processOptions(window._sj);
			window._sj = SJ;
		}

        if (opts.scanOnLoad) {
            SJ.Install();
        }
        flush();
    });
})();

module.exports = SJ

