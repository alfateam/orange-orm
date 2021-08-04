function act(c){
	c.relations = [];
	c.shallowFilter = {};
	c.returned = c.sut(c.relations,c.shallowFilter);
}

module.exports = act;