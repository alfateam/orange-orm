function act(c){	
	c.expected = {};
	c.shallowFilter.prepend.expect(' WHERE <joinSql> AND ').return(c.expected);	
	c.returned = c.sut(c.relation,c.shallowFilter);
}

module.exports = act;