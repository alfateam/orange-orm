function act(c){
	c.expected =  ' WHERE <joinSql>';

	c.returned = c.sut(c.relations);	
}

module.exports = act;