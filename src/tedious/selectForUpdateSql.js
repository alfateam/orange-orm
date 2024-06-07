const quote = require('../table/quote');

module.exports = function(alias) {
	return ' FOR UPDATE OF ' + quote(alias);
};