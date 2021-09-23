var createJSONReadStreamNative = require('./createJSONReadStreamNative');
var createJSONReadStreamDefault = require('./createJSONReadStreamDefault');

function createJSONReadStream(table, db, filter, strategy, streamOptions) {
	var create;
	var c = {};

	c.visitPg = function() {
		create = createJSONReadStreamNative;
	};

	c.visitMySql = c.visitPg;

	c.visitSqlite = function() {
		create = createJSONReadStreamDefault;
	};
	c.visitSap = c.visitSqlite;

	db.accept(c);

	return create(table, db, filter, strategy, streamOptions);
}

module.exports = createJSONReadStream;
