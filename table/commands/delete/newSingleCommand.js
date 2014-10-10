var newSubFilter = require('./singleCommand/subFilter');
var newDiscriminatorSql = require('../../query/singleQuery/newDiscriminatorSql');

function _new(table,filter,relations) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var alias = '_' + relations.length;
		if (relations.length !== 0)
			filter = newSubFilter(relations, filter);
		else {
			appendDiscriminator();
			var discr  = newDiscriminatorSql(name,alias);
			filter = filter.append(discr);
		}
		var sql =  'delete from ' + name + ' ' + alias  + ' where ' + filter.sql();
		return sql;

		function appendDiscriminator() {
//todo
			var discr  = newDiscriminatorSql(name,alias);
			filter = filter.append(discr);
			if (filter) 

		}

	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;