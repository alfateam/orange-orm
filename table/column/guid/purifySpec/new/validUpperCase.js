function act(c){
	c.candidate = '0CC5856A-7143-4C3B-A2B7-E43C475B60DC';
	c.didThrow = false;
	try {
		c.returned = c.sut(c.candidate);
	}
	catch(err) {
		c.didThrow = true;
	}
}

act.base = '../new'
module.exports = act;