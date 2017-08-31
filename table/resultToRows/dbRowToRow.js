var negotiateQueryContext = require('./negotiateQueryContext');
var decodeDbRow = require('./decodeDbRow');
var nextDbRowToRow = _nextDbRowToRow;


function dbRowToRow(span, dbRow, queryContext) {
	var table = span.table;
	var row = decodeDbRow(span, table, dbRow);
	negotiateQueryContext(queryContext, row);
	row.queryContext = queryContext;		
	var cache = table._cache;
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

	c.visitMany = function(leg) {
	};

	span.legs.forEach(onEach);

	function onEach (leg) {
		leg.accept(c);
	}

	return row;
}

function _nextDbRowToRow (span, dbRow) {
	nextDbRowToRow = require('./dbRowToRow');
	nextDbRowToRow(span, dbRow);
}

module.exports = dbRowToRow;