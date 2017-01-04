function act(c){
	c.sql = 'sql';
	c.query.sql = c.sql;
	c.returned = c.sut(c.query);
}

act.base = '../object';
module.exports = act;