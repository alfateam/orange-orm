var dbNull = {};

function act(c) {	
	c.value = {};
	c.param = {};

	c.stringIsSafe.expect(c.value).return(false);

	c.newParam.expect('$').return(c.param);

	c.parameters = {};
	c.param.parameters = c.mock();
	c.param.parameters.expect().return(c.parameters);

	c.parameters.add = c.mock();
	c.parameters.add.expect(c.value);

	c.returned = c.sut(c.value);
}

act.base = '../new';
module.exports = act;