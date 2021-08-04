var connString = 'postgres';
var poolOptions = {};

function act(c){
	
	c.database = {};
	c.newSqliteDatabase.expect(connString, poolOptions).return(c.database);
	c.returned = c.sut.sqlite(connString, poolOptions);
}

module.exports = act;