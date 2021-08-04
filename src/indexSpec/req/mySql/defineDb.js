var connString = 'mysql...';
var poolOptions = {};

function act(c){	
	c.database = {};
	c.newMySqlDatabase.expect(connString, poolOptions).return(c.database);
	c.returned = c.sut(connString, poolOptions);
}

module.exports = act;