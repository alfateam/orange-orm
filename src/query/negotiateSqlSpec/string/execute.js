function act(c){
	c.sql = 'sql';
	
	c.returned = c.sut(c.sql);
}

act.base = '../req';
module.exports = act;