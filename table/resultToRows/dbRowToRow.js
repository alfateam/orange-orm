var shallowDbRowToRow = require('./shallowDbRowToRow');
var nextDbRowToRow = _nextDbRowToRow;

function dbRowToRow(span, dbRow) {
	var row = shallowDbRowToRow(span.table, dbRow);

	var c = {};
	
	c.visitOne = function(leg) {
		nextDbRowToRow(leg.span, dbRow);
	};

	c.visitJoin = c.visitOne;
	c.visitMany = function(leg) {};

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