function act(c){
	c.returned = c.sut(c.row);
}

module.exports = act;