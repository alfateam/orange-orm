function act(c){
	c.connectionString = 'postgres://blabla';
	c.id = 'someId';
	c.newId.expect().return(c.id);
	c.expected = JSON.stringify(c.id);

	c.returned = c.sut(c.connectionString);
}

module.exports = act;