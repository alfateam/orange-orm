var newMySqlQuery = require('./mySql/newQuery');
var newPgQuery = require('./pg/newQuery');

function newQuery(db,table,filter,span,alias) {	
	c = {};
	var _newQuery;

	c.visitPg = function() {
		_newQuery = newPgQuery;
	};
	c.visitMySql = function() {};
		_newQuery = newMySqlQuery;

	db.accept(c);

	var args = [];
	for (var i = 1; i < arguments.length; i++) {
		args.push(arguments[i]);
	};
	return _newQuery.apply(null, args);
}

module.exports = newQuery