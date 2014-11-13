var newCollection = require('../../newCollection');
var extractSql = require('./extractSql');

function _new(text) {
	text = extractSql(text);
	var optionalParams = [];
	var c = {};
	
	for (var i = 1; i < arguments.length; i++) {
		optionalParams.push(arguments[i]);
	}
	
	c.parameters = newCollection.apply(null, optionalParams);
	
	c.addParameter = function(parameter) {
		var params = [text];
		params = params.concat(optionalParams);
		params.push(parameter);
		return newParameterized(params);
	};

	c.sql = function() {
		return text;
	};

	c.prepend = function(other) {				
		if (other.hasOwnProperty('sql')) 
			return prependParameterized(other);
		else
			return prependText(other);			
	};

	function prependParameterized(other) {		
		var params = [other.sql() + text];
		var otherParameters = other.parameters.toArray();			
		params = params.concat(otherParameters).concat(optionalParams);
		return newParameterized(params);
	}

	function prependText(other) {
		var params = [other + text].concat(optionalParams);
		return newParameterized(params);
	}

	c.append = function(other) {				
		if (other.hasOwnProperty('sql')) 
			return appendParameterized(other);
		else
			return appendText(other);			
	};

	function appendParameterized(other) {	
		var params = [text + other.sql()];
		var otherParameters = other.parameters.toArray();			
		params = params.concat(optionalParams).concat(otherParameters);
		return newParameterized(params);
	}

	function appendText(other) {
		var params = [text + other].concat(optionalParams);
		return newParameterized(params);
	}


	function newParameterized(params) {
		return require('../query/newParameterized').apply(null, params);		
	}
	
	return c;
}


module.exports = _new;
