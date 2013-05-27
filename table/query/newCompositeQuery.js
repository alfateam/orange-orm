var newCompositeSql = require('./newCompositeSql');
var newCompositeParameters = require('./newCompositeParameters');

function _new() {
	var c = {};
	var compositeSql = newCompositeSql();
	var compositeParameters = newCompositeParameters();
	
	c.add = function(query) {
		compositeSql.add(query);
		compositeParameters.add(query);
		return c;
	};

	c.parameters = function() {
		return compositeParameters;
	};

	c.sql = function()	{
		return compositeSql.sql();
	};
	
	return c;
}

module.exports = _new;