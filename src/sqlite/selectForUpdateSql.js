const quote = require('../table/quote');

module.exports = function(context, alias) {
	return ' FOR UPDATE OF ' + quote(context, alias);
};