function act(c){	
	c.text = {};
	c.returned = c.sut(c.text);
}

act.base = '../req'
module.exports = act;