var empty = require('../resultToPromise')();
var extractParentKey = require('../relation/manyCache/extractParentKey');
var resultToPromise = require('../resultToPromise');
var newFarRelativesFilter = require('./newFarRelativesFilter');

function getFarRelatives(parentRow, relation) {
	if (!parentRow.queryContext)
		return empty;
	var filter = newFarRelativesFilter(relation, parentRow.queryContext);
	var table = relation.childTable;
	var joinRelation = relation.joinRelation;
	return table.getMany(filter).then(onRows);

	function onRows(rows) {
		for (var i = 0; i < rows.length; i++) {
			var parent = extractParentKey(joinRelation, rows[i]);
			relation.expand(parent);
		};
	}
}

module.exports = getFarRelatives;