var shallowDbRowToRow = require('./shallowDbRowToRow');
var nextDbRowToRow = _nextDbRowToRow;
var decodeDbRow = require('./decodeDbRow');

function dbRowToRow(span, dbRow) {
	var table = span.table;
	var decoded = decodeDbRow(table, dbRow);
	var row = shallowDbRowToRow(table, decoded);	
	var cache = table._cache;
	row = cache.tryAdd(row);

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

	return row;
}

function _nextDbRowToRow (span, dbRow) {
	nextDbRowToRow = require('./dbRowToRow');
	nextDbRowToRow(span, dbRow);
}

module.exports = dbRowToRow;