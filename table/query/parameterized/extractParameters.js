function extract(parameters) {	
	if (parameters) {
		return parameters.slice(0);	
	}
	return [];
}

module.exports = extract;
