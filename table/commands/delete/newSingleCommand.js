 var newSubFilter = require('./singleCommand/subFilter');
 var newDiscriminatorSql = require('../../query/singleQuery/newDiscriminatorSql');
 var extractFilter = require('../../query/extractFilter');
 var newSingleCommandCore = require('./singleCommand/newSingleCommandCore');

function _new(table,filter,relations) {
	var alias = '_' + relations.length;
	filter = extractFilter(filter);
	filter = newSubFilter(relations, filter);
	var discriminator = newDiscriminatorSql(table, alias);
	if (discriminator !== '')
		filter = filter.and(discriminator);
	return newSingleCommandCore(table, filter, alias);
}

module.exports = _new;