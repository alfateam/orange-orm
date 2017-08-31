function newQueryContext(filter, alias, innerJoin) {
	var rows = [];

	var c = {};
	c.filter = filter;
	c.alias = alias;
	c.innerJoin = innerJoin;
	c.rows = rows;

	c.expand = function(relation) {
		rows.forEach(function(row) {
			relation.expand(row);
		});
	};

	c.add = function(row) {
		rows.push(row);
	};

	return c;
}

module.exports = newQueryContext;