var tryParseISO = require('./tryParseISO');
var dateToISOString = require('../../../dateToISOString');

function purify(value) {
	if(value == null)
		return null;
	if (value.toISOString)
		return dateToISOString(value);
	if (value.indexOf('Z') > -1)
		return 	dateToISOString(new Date(value));
	var iso = tryParseISO(value);
	if (iso)
		return iso;
	return value;
}

module.exports = purify;