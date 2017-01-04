function act(c){
	c.expected = [];
	c.returned = c.sut(undefined);
}

module.exports = act;