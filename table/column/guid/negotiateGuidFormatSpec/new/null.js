function act(c){
	c.didThrow = false;
	try {
		c.returned = c.sut(null);
	}
	catch(err) {
		c.didThrow = true;
	}
}

act.base = '../new'
module.exports = act;