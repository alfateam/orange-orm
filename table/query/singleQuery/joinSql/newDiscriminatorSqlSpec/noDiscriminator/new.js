var discriminatorSqlCore = '';

function act(c){
	c.newDiscriminatorSqlCore.expect(c.table,c.alias).return(discriminatorSqlCore);
	c.expected = '';
	c.new()	
}

act.base = '../req';
module.exports = act;