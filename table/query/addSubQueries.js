var manyLegToQuery = require('./addSubQueries/manyLegToQuery');

function addSubQueries(compositeQuery,table,filter,span,alias) {
	var c = {};
	c.visitJoin = function() {};
	c.visitOne = function() {};
	c.visitMany = function(leg) {
		var query = manyLegToQuery(alias,leg,filter);
		compositeQuery.add(query);
	};

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg) {
		leg.accept(c);
	}

	return compositeQuery;
}

module.exports = addSubQueries;