function act(c){	
	c.returned = c.sut();
}

act.base = '../req'
module.exports = act;