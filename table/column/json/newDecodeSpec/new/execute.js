var dbNull = {};
var value = '{"a":"bar"}';

function act(c) {	
	c.value = value;
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.expected = {a: 'bar'};
	c.returned = c.sut(value);
}

act.base = '../new';
module.exports = act;