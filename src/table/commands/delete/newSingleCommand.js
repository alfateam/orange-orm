var newSubFilter = require('./singleCommand/subFilter');
var newDiscriminatorSql = require('../../query/singleQuery/newDiscriminatorSql');
var extractFilter = require('../../query/extractFilter');
var newSingleCommandCore = require('./singleCommand/newSingleCommandCore');
var createAlias = require('./createAlias');

function _new(context, table, filter, relations) {
	var alias = createAlias(table, relations.length);
	filter = extractFilter(filter);
	filter = newSubFilter(context, relations, filter);
	var discriminator = newDiscriminatorSql(context, table, alias);
	if (discriminator !== '')
		filter = filter.and(context, discriminator);
	return newSingleCommandCore(context, table, filter, alias);
}

module.exports = _new;