function act(c){
	c.candidate = '0cc5856a-7143-4c3b-a2b7-e43c475b60dc';
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