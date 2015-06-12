var tryParseISO = require('./tryParseISO');
var cloneDate = require('./cloneDate');

function purify(value) {			
	if(value == null)
		return null;	

	if (value.toISOString) 
		return cloneDate(value);

	var iso = tryParseISO(value);
	if (iso)
		return iso;	
	
	return cloneDate(value);
}

module.exports = purify;