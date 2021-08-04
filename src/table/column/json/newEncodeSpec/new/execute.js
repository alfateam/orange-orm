var dbNull = {};
var candidate = {};
var value = {foo: 1};

function act(c) {	
	c.expected = {};

	c.purify.expect(candidate).return(value);
	c.newParam.expect('?', [JSON.stringify(value)]).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(candidate);
}

act.base = '../new';
module.exports = act;