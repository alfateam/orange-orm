var newSubFilter = require('../../relatedTable/subFilter');

function _new(table,filter,relations) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var alias = '_' + relations.length;
		if (relations.length !== 0)
			filter = newSubFilter(relations, filter);
		var sql =  'delete from ' + name + ' ' + alias  + ' where ' + filter.sql();
		console.log(sql);
		return sql;
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;