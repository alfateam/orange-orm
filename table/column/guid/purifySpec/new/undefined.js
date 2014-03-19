function act(c){
	c.didThrow = false;
	try {
		c.returned = c.sut(undefined);
	}
	catch(err) {
		c.didThrow = true;
	}
}

act.base = '../new'
module.exports = act;