var newPgQuery = require('./pg/newQuery');
var getSessionContext = require('../getSessionContext');

function newQuery() {
	var c = {};
	var _newQuery;

	c.visitPg = function() {
		_newQuery = newPgQuery;
	};
	c.visitMySql = function() {
		throw new Error('MySql not supported');
	};

	c.visitSqlite = function() {
		throw new Error('Sqlite not supported');
	};

	getSessionContext().accept(c);

	return _newQuery.apply(null, arguments);
}

module.exports = newQuery;