function act(c){
	c.didThrow = false;
	try {
		c.sut('0cc5856a-7143-4c3b-a2b7-e43c475b60dc');
	}
	catch(err) {
		c.didThrow = true;
	}
}

act.base = '../new'
module.exports = act;