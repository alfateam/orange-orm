function act(c){
	c.changeSet = [];
	c.domain[c.changeSetId] = c.changeSet;
	c.returned = c.sut();
}

module.exports = act;