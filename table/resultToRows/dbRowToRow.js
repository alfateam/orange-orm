var shallowDbRowToRow = require('./shallowDbRowToRow');
var nextDbRowToRow = _nextDbRowToRow;

function dbRowToRow(span, dbRow) {
	var table = span.table;
	var row = shallowDbRowToRow(table, dbRow);
	var result = row;
	
	var cache = table._cache;
	if (!cache.tryAdd(row))
		result = cache.tryGet(row);

	var c = {};
	
	c.visitOne = function(leg) {
		nextDbRowToRow(leg.span, dbRow);
		leg.expand(row);
	};

	c.visitJoin = function(leg) {
		nextDbRowToRow(leg.span, dbRow);
	};

	c.visitMany = function(leg) {
		leg.expand(row);		
	};

	span.legs.forEach(onEach);

	function onEach (leg) {
		leg.accept(c);
	}

	return result;
}

function _nextDbRowToRow (span, dbRow) {
	nextDbRowToRow = require('./dbRowToRow');
	nextDbRowToRow(span, dbRow);
}

module.exports = dbRowToRow;