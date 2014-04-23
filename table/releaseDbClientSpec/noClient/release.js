function act(c){	
	try {
		c.sut();
	}	
	catch(e) {
		c.didThrow = true;
	}
	
}

module.exports = act;