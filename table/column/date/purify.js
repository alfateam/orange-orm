function purify(value) {		
	
	if(value == null)
		return null;

	if (! (value['toISOString']))
		return new Date(value);
	return value;
}

module.exports = purify;