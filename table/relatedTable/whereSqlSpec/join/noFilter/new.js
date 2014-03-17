function act(c){
	c.expected =  ' WHERE <joinSql>';

	c.returned = c.sut(c.relation);	
}

module.exports = act;