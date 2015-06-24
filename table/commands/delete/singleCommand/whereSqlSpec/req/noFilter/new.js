function act(c){
	c.expected =  ' WHERE <joinSql>';

	c.returned = c.sut(c.relations, undefined, c.rightAlias);	
}

module.exports = act;