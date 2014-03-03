var Promise = require('promise');

module.exports = function(func) {
	return new Promise(func);
}