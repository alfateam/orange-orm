var negotiateQueryContext = require('./negotiateQueryContext');
var decodeDbRow = require('./decodeDbRow');

function dbRowToRow(context, span, dbRow) {
	var table = span.table;
	var row = decodeDbRow(context, span, table, dbRow);
	var cache = table._cache;
	if (!cache.tryGet(context, row)) {
		var queryContext = span.queryContext;
		negotiateQueryContext(queryContext, row);
		Object.defineProperty(row, 'queryContext', {
			writable: true,
			configurable: true,
			enumerable: false
		});
		row.queryContext = queryContext;
	}
	row = cache.tryAdd(context, row);

	var c = {};

	c.visitOne = function(leg) {
		dbRowToRow(context, leg.span, dbRow);
		leg.expand(row);
	};

	c.visitJoin = function(leg) {
		dbRowToRow(context, leg.span, dbRow);
		leg.expand(row);
	};

	c.visitMany = function() {
	};

	span.legs.forEach(onEach);

	function onEach(leg) {
		leg.accept(c);
	}

	return row;
}

module.exports = dbRowToRow;