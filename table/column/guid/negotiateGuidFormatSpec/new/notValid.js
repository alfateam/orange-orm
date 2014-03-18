function act(c){
	c.expectedMessage = '0cc5856a-7143-4c3b-a2b7-e43c4 is not a valid UUID';
	try {
		c.sut('0cc5856a-7143-4c3b-a2b7-e43c4');
	}
	catch(err) {
		c.thrownMessage = err.message;
	}
}

act.base = '../new'
module.exports = act;