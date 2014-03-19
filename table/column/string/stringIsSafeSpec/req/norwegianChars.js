function act(c){	
	c.norwegianChars = '\u00C6\u00E6124';
	
	c.returned = c.sut(c.norwegianChars);
}

module.exports = act;