function act(c){
	c.orderBy = {};
	c.returned = c.sut(c.table, c.alias, c.orderBy);
}

module.exports = act;