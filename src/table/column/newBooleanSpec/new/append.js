var other = {};
var tempFilter = {}

function act(c){
	c.expected = {};
	c.filter.append = c.mock();
	c.filter.append.expect(other).return(tempFilter);	

	c.nextNewBoolean = c.requireMock('./newBoolean');
	c.nextNewBoolean.expect(tempFilter).return(c.expected);
	
	
	c.returned = c.sut.append(other);
}

module.exports = act;