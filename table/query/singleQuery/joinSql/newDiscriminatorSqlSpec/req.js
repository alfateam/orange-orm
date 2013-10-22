var a = require('a');
var requireMock = a.requireMock;
var sut;

function act(c){
	c.table = {};
	c.alias = 'alias';
	c.newDiscriminatorSqlCore = requireMock('../newDiscriminatorSql');		
	sut  = require('../../joinSql/newDiscriminatorSql');
	
	c.new = function() {
		c.returned = sut(c.table, c.alias);	
	}
	
}

module.exports = act;