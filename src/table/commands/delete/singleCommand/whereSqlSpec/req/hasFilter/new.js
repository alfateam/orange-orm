function act(c){
	c.expected = {};
	c.shallowFilter.prepend.expect(' WHERE <joinSql> AND ').return(c.expected);

	c.returned = c.sut(c.relations,c.shallowFilter,c.rightAlias);	
}

module.exports = act;