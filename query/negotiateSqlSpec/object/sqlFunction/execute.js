function act(c){
	c.sql = 'sql';
	c.sqlFunction = function() { return c.sql; };
	c.query.sql = c.sqlFunction;
	c.returned = c.sut(c.query);
}

act.base = '../object';
module.exports = act;