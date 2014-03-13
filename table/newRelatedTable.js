var newRelatedColumn = require('./relatedTable/relatedColumn');

function newRelatedTable(relations) {
	var table = relations[relations.length-1].childTable;
	var columns = table._columns;	
	var c = {};

	for (var i = 0; i < columns.length; i++) {
		var col = columns[i];
		c[col.alias] = newRelatedColumn(col,relations);
	};
	
	return c;
}

module.exports = newRelatedTable