/*
 * dom.js - Handles DOM manipulation, reading, writing, etc
 */ 

/**
 * Query constructor
 */
function dom(opts) {
    opts = opts || {};
    if (opts.prefix) {
        this.prefix = opts.prefix;
    }
    this.domNodes = {};
    if (opts.domNodes) {
        this.domNodes = opts.domNodes;
    }
    this.domTargets = {};
    if (opts.domTargets) {
        this.domTargets = opts.domTargets;
    }
}

dom.prototype = {
	/**
     * Bind to a DOM event
     */
    bind : function(node, eventType, handler) {
        if (node.addEventListener) {
            node.addEventListener(eventType, handler, false);
        } else if (node.attachEvent) {
            node.attachEvent('on' + eventType, function (e) { handler.apply(node, [e]); });
        }
    },

    /**
     * Retrieves content from a document meta tag
     */
    getMeta : function(metaName) {
        var i,
            metas = document.getElementsByTagName('meta');
        for (i = 0; i < metas.length; i++) {
            if (metas[i].getAttribute('name') == metaName) {
                return metas[i].getAttribute('content');
            }
        }
        return '';
    },

    /**
     * Imports a CSS file to the page
     */
    importCss : function(path) {
        var css = document.createElement('link')
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', path);
        document.getElementsByTagName('head')[0].appendChild(css);
    },

    /**
     * Return the html entitised version of a text string
     */
    entitise : function(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    },

    /**
     * Propagates data parameters from the 'from' node to the 'to' node
     */
    copyDynamicProperties : function(from, to) {
        if (!this.dynPropCopied) {    
            if ((this.firstNode(from) !== undefined) && (this.hasNode(to))) {
                var res = this.firstNode(to);
                var attrs = this.dynamicAttrs(this);
                if (typeof attrs === 'object') {
                    for (var key in attrs) {
                        if (attrs.hasOwnProperty(key)) {
                            // Propagate relevant data parameters from the query input to the results div
                            res.setAttribute(this.prefix+key, attrs[key]);
                        }
                    }
                }
            }
            this.dynPropCopied = true;
        }
    },

    /**
     * Try to get all the target elements from the DOM
     * Polyfill for browsers that don't have getElementsByAttribute
     */
    scanShim : function(scope) {
        // Try to use the built in if it is supported
        if (document.getElementsByAttribute !== undefined) {
            for (var i = 0; i < this.domTargets.length; i++) {
                elements = document.getElementsByAttribute(this.prefix + this.domTargets[i], '*');
                if (elements.length > 0) {
                    dom.domNodes[this.domTargets[i]] = elements;
                }
            }
            return
        }
        // Not supported, run the polyfill instead
        if (scope.nodeType === 1) {
            for (var i = 0; i < this.domTargets.length; i++) {
                if (scope.hasAttribute(this.prefix + this.domTargets[i])) {
                    if (this.domNodes[this.domTargets[i]] === undefined) {
                        this.domNodes[this.domTargets[i]] = [];
                    }
                    this.domNodes[this.domTargets[i]].push(scope);                }
            }
            if (scope.childNodes !== undefined) {
                for (var j = 0; j < scope.childNodes.length; j++) {
                    this.scanShim(scope.childNodes[j], this.domTargets, this.domNodes);
                }
            }
        }
    },

    /**
     * Returns the value of a this.prefix attribute or the default value
     */
    attrVal : function(node, attr, defaultVal) {
        if (node.hasAttribute(this.prefix+attr)) { 
            return node.getAttribute(this.prefix+attr);
        } else {
            return defaultVal;
        }
    },

    /**
     * Returns an object of the dynamic this.prefix attributes. That is, the non-known DOM targets.
     */
    dynamicAttrs : function(node) {
        var m,
            attrs = {};
        for (var i in node.attributes) {
            var attrib = node.attributes[i];
            if (attrib.specified) {
                m = /^data\-sj\-(.+)$/.exec(attrib.name);
                if (m && this.domTargets.indexOf(m[1]) === -1) {
                    attrs[m[1]] = attrib.value;
                }
            }
        }
        return attrs;
    },

    /**
     * Returns the URI parameters of dynamic this.prefix attributes
     */
    dynamicAttrsUri : function(node) {
        var uri = [],
            attrs = this.dynamicAttrs(node);
        for (var i in attrs) {
            uri.push(encodeURIComponent(i)+'='+encodeURIComponent(attrs[i]));
        }
        return uri.join('&');
    },

    /**
     * Call the callback for each node with the given attribute.
     * First argument to the callback is the node, second is the attribute we looked for.
     */
    eachNode : function(attr, callback) {
        if (this.hasNode(attr)) {
            for (var i = 0; i < this.domNodes[attr].length; i++) {
                callback(this.domNodes[attr][i], this.prefix + attr);
            }
        }
    },

    /**
     * Return the first node for the given attribute, or undefined if there isn't one.
     */
    hasNode : function(attr) {
        return (this.domNodes[attr] !== undefined && this.domNodes[attr].length > 0);
    },

    /**
     * Return the first node for the given attribute, or undefined if there isn't one.
     */
    firstNode : function(attr) {
        if (!this.hasNode(attr)) {
            return undefined;
        }
        return this.domNodes[attr][0];
    },

    /**
     * Return the attribute value of the first node for the given attribute.
     * Returns undefined if there is no node for that attribute.
     */
    firstNodeVal : function(attr, defaultVal) {
        var node = this.firstNode(attr);
        return (node !== undefined ? node.getAttribute(this.prefix + attr) : defaultVal);
    }
}

module.exports = dom;