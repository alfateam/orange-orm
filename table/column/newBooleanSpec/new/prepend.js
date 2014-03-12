var other = {};
var tempFilter = {}

function act(c){
	c.expected = {};
	c.filter.prepend = c.mock();
	c.filter.prepend.expect(other).return(tempFilter);	

	c.nextNewBoolean = c.requireMock('./newBoolean');
	c.nextNewBoolean.expect(tempFilter).return(c.expected);
	
	
	c.returned = c.sut.prepend(other);
}

module.exports = act;