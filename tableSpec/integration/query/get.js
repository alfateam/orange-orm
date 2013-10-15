var a = require('a');
var requireMock = a.requireMock;
var table;
var result = {};
var rows = {};
var legs = require('../../../newCollection')();
var span = {};

function act(c) {
	c.rows = rows;
	stubExecute();	
	newSut();
	getAll();

	function stubExecute() {
		var strategyToSpan = requireMock('./strategyToSpan');			
		var resultToRows = requireMock('./resultToRows');
		var executeQuery = requireMock('./executeQuery');
		var tryGetFromCacheById = requireMock('./tryGetFromCacheById');		
		span.legs = legs;
		strategyToSpan.expectAnything().return(span);
		executeQuery.expectAnything().whenCalled(onExecute).return(result);

		function onExecute(query) {
			console.log(query.sql());
			resultToRows.expect(table,span,result).return(rows);
		};
	}

	function newSut() {
		table = require('../../../table')('order');
		table.primaryColumn('id').integer();
		c.sut = table;
	}

	function getAll() {
		c.returned = c.sut.getMany();
	}
}

module.exports = act;