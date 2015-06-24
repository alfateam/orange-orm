function act(c){
	c.expected = {};
	c.relation.rightAlias = {};


	c.returned = c.sut();

}

module.exports = act;