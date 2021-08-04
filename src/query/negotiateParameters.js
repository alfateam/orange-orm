function negotiateParameters(parameters) {
	if(parameters === undefined)
		return [];
	else if(parameters.length !== undefined)
		return parameters;
	else
		throw new Error('Query has invalid parameters property. Must be undefined or array');
}

module.exports = negotiateParameters;