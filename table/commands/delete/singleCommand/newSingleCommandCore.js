var newDiscriminatorSql = require('../../../query/singleQuery/newDiscriminatorSql');

function newSingleCommandCore(table,filter,alias) {
	var c = {};
//todo
	c.sql = function() {
		// var name = table._dbName;
		// var alias = '_' + relations.length;
		// if (relations.length !== 0)
		// 	filter = newSubFilter(relations, filter);
		// else {
		// 	appendDiscriminator();
		// 	var discr  = newDiscriminatorSql(name,alias);
		// 	filter = filter.append(discr);
		// }
		// var sql =  'delete from ' + name + ' ' + alias  + ' where ' + filter.sql();
		// return sql;
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = newSingleCommandCore;