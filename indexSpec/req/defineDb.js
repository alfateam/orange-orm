var connString = {};

function act(c){
	
	c.database = {};
	c.newDatabase.expect(connString).return(c.database);
	c.returned = c.sut(connString);
}

module.exports = act;