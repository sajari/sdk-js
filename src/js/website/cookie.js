/*
 * cookie.js - Handles cookie set and gets. Assumes there is a browser window and document, etc
 */ 

var cookie = {
    /**
     * Sets a browser cookie
     */
	set : function(name, value, days) {
        var expires = '',
            domain = ';domain=' + window.location.hostname.toLowerCase().replace(/^www(.)/, ''),
            path = ';path=/';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = ';expires=' + date.toGMTString();
        }
        document.cookie = name + '=' + escape(value) + expires + domain + path;
    },

    /**
     * Reads the content of a cookie
     */
	get : function(name) {
        var nameEQ = name + "=",
        ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ')
                c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0)
                return c.substring(nameEQ.length, c.length);
        }
        return undefined;
    }
}

module.exports = cookie;