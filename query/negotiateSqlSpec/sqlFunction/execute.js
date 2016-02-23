function act(c){
	c.sql = 'sql';
	
	c.sqlFunction = function() { return c.sql; };
	c.returned = c.sut(c.sqlFunction);
}

act.base = '../req';
module.exports = act;