var negotiateQueryContext = require('./negotiateQueryContext');
var decodeDbRow = require('./decodeDbRow');
var nextDbRowToRow = _nextDbRowToRow;


function dbRowToRow(span, dbRow) {
	var table = span.table;
	var row = decodeDbRow(span, table, dbRow);
	var cache = table._cache;
	if (!cache.tryGet(row)) {
		var queryContext = span.queryContext;
		negotiateQueryContext(queryContext, row);
		Object.defineProperty(row, 'queryContext', {
			writable: true,
			configurable: true,
			enumerable: false
		});
		row.queryContext = queryContext;
	}
	row = cache.tryAdd(row);

	var c = {};

	c.visitOne = function(leg) {
		nextDbRowToRow(leg.span, dbRow);
		leg.expand(row);
	};

	c.visitJoin = function(leg) {
		nextDbRowToRow(leg.span, dbRow);
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

function _nextDbRowToRow(span, dbRow) {
	nextDbRowToRow = require('./dbRowToRow');
	nextDbRowToRow(span, dbRow);
}

module.exports = dbRowToRow;