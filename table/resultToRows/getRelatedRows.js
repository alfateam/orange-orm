var tryGetById = require('../tryGetByIdSync');

function getRelatedRows(relation, parentRow) {
	var args = [relation.childTable];
	var columns = relation.columns;
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i]
		var alias = column.alias;
		args.push(parentRow[alias]);
	};
	return tryGetById.apply(null,args);
}

module.exports = getRelatedRows;