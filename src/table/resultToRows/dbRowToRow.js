var negotiateQueryContext = require('./negotiateQueryContext');
var decodeDbRow = require('./decodeDbRow');

function dbRowToRow(context, span, dbRow) {
	var table = span.table;
	var row = decodeDbRow(context, span, table, dbRow);
	if (!hasPrimaryKey(row, table)) {
		skipNestedLegs(span, dbRow);
		return null;
	}
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
		let child = dbRowToRow(context, leg.span, dbRow);
		if (child)
			leg.expand(row);
	};

	c.visitJoin = function(leg) {
		let child = dbRowToRow(context, leg.span, dbRow);
		if (child)
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

function hasPrimaryKey(row, table) {
	return table._primaryColumns.every((column) => {
		let value = row[column.alias];
		return value !== null && value !== undefined;
	});
}

function skipNestedLegs(span, dbRow) {
	span.legs.forEach((leg) => {
		leg.accept({
			visitOne() {
				skipSpan(leg.span, dbRow);
			},
			visitJoin() {
				skipSpan(leg.span, dbRow);
			},
			visitMany() {
			}
		});
	});
}

function skipSpan(span, dbRow) {
	decodeDbRow(undefined, span, span.table, dbRow);
	skipNestedLegs(span, dbRow);
}

module.exports = dbRowToRow;
