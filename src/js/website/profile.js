/*
 * profile.js - Handles Sajari profile information
 */
var cookie = require("./utils/cookie");

/**
 * Profile constructor
 */
function profile(options) {
	options = options || {};
	for (var o in options) {
		this[o] = options[o];
	}
	if (options.meta === undefined) {
		this.meta = {};
	}
	this.gaId = getGAID();

	if (this.visitorId === undefined) {
        this.visitorId = cookie.get('sjID');
        if (this.visitorId === undefined) {
            this.visitorId = (new Date().getTime()) + '.' + Math.floor(Math.random() * 1000000);
        }
        cookie.set('sjID', this.visitorId, 365);
    }
}

profile.prototype = {

	encode: function() {

	},

	/**
	 * Sets a hardcoded visitor identifier
	 */
	setVisitorId : function(id) {
	    if (id !== undefined) {
	        this.visitorId = id + ''
	        cookie.set('sjID', this.visitorId, 365);
	    }
	    return this.visitorId;
	}
}

/**
 * Returns the current visitors Google Analytics ID if it exists
 */
function getGAID() {
    var userId = '';
    var gaUserCookie = cookie.get("_ga"); 
    if (gaUserCookie !== undefined) { 
        var cookieValues = gaUserCookie.split('.');
        if (cookieValues.length > 2 ) { 
            userId = cookieValues[2]; 
        }  
    } 
    return userId;
}

module.exports = profile; 