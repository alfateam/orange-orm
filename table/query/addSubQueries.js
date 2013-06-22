var manyLegToQuery = require('./addSubQueries/manyLegToQuery');

function addSubQueries(compositeQuery,table,filter,span,alias) {
	var c = {};
	c.visitJoinLeg = function() {};
	c.visitOneLeg = function() {};
	c.visitManyLeg = function(leg) {
		var query = manyLegToQuery(alias,leg,filter);
		compositeQuery.add(query);
	};

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg) {
		leg.accept(c);
	}
}

module.exports = addSubQueries;