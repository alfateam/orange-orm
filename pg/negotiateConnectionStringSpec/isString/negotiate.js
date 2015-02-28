function act(c){
	c.connectionString = 'postgres://blabla';
	c.id = 'someId';
	c.newId.expect().return(c.id);
	c.expected = c.id + c.connectionString;

	c.returned = c.sut(c.connectionString);
}

module.exports = act;