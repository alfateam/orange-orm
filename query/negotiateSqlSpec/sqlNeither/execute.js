function act(c){
	c.parameters = 'parameters';
	
	c.query = {
		parameters: c.parameters
	};

	try {	
		c.returned = c.sut(c.query);
	} catch(e) {
		c.thrownMessage = e.message;
	}
}

act.base = '../req';
module.exports = act;