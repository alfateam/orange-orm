var anded = {};
var negated = {},
	negated2 = {};
var nextBoolean = {};

function act(c){	
	c.expected = {};
		
	c.filter.prepend = c.mock();
	c.filter.prepend.expect('NOT (').return(negated)
	negated.append = c.mock();
	negated.append.expect(')').return(negated2);
	
	c.nextNewBoolean = c.requireMock('./newBoolean');
	c.nextNewBoolean.expect(negated2).return(c.expected);
	
	c.returned = c.sut.not();
}

module.exports = act;