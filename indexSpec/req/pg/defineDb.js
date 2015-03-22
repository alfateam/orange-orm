var connString = 'postgres';
var poolOptions = {};

function act(c){
	
	c.database = {};
	c.newDatabase.expect(connString, poolOptions).return(c.database);
	c.returned = c.sut(connString, poolOptions);
}

module.exports = act;