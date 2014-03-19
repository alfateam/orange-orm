function act(c){
	c.unsafeChars = 'ad\'\\_';	
	
	c.returned = c.sut(c.unsafeChars);
}

module.exports = act;