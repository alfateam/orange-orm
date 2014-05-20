var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.newToDto = requireMock('./newToDto');
	c.promise = requireMock('../../promise');
	c.promise.all = c.mock();
	c.relationName = 'lines';
	c.relation = {};
	c.lineTable = {};
	c.relation.childTable = c.lineTable;
	c.lineStrategy = {};
	c.strategy = {lines : c.lineStrategy, other: {}};
	c.dto = {};	

	c.toDto = {};
	c.toDto = c.mock();
	c.newToDto.expect(c.lineStrategy, c.lineTable).return(c.toDto);

	c.sut = require('../newManyRelatedToDto')(c.relationName, c.relation, c.strategy, c.dto);

}

module.exports = act;