
function act(c) {	
	var mock = c.mock;
	c.expected = {};
	c.newParameterized.expect('1=2').return(c.expected);	
	c.returned = c.sut(c.column,[]);
}

module.exports = act;