
function act(c){
	c.connectionString = { foo: 'foo value', bar: 'bar value' };
	c.newId.expect().return('<someId>');
	c.expected = JSON.stringify('<someId>');

	c.returned = c.sut(c.connectionString);
}

module.exports = act;