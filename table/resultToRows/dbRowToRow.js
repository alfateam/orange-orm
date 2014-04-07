var shallowDbRowToRow = require('./shallowDbRowToRow');
var nextDbRowToRow = _nextDbRowToRow;

function dbRowToRow(span, dbRow) {
	var table = span.table;
	var shallowRow = shallowDbRowToRow(table, dbRow);
	var row = table._cache.tryAdd(shallowRow);

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