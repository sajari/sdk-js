

/**
 * Robust isArray checker
 */
function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

module.exports = isArray; 