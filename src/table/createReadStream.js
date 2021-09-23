var createReadStreamNative = require('./createReadStreamNative');
var createReadStreamDefault = require('./createReadStreamDefault');

function createReadStream(table, db, filter, strategy, streamOptions) {
	var create;
	var c = {};

	c.visitPg = function() {
		create =  createReadStreamNative;
	};

	c.visitMySql = c.visitPg;

	c.visitSqlite = function() {
		create =  createReadStreamDefault;
	};
	c.visitSap = c.visitSqlite;

	db.accept(c);

	return create(table, db, filter, strategy, streamOptions);
}

module.exports = createReadStream;