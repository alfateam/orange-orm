var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.newToDto = requireMock('./newToDto');
	c.relationName = 'customer';
	c.relation = {};
	c.customerTable = {};
	c.relation.childTable = c.customerTable;
	c.customerStrategy = {product : c.productStrategy};
	c.strategy = {customer : c.customerStrategy, other: {}};
	c.dto = {};	

	c.toDto = {};
	c.toDto = c.mock();
	c.newToDto.expect(c.customerStrategy, c.customerTable).return(c.toDto);

	c.sut = require('../newSingleRelatedToDto')(c.relationName, c.relation, c.strategy, c.dto);

}

module.exports = act;