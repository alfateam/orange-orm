function act(c){
	c.unsafeChars = 'a\'djjj';	
	
	c.returned = c.sut(c.unsafeChars);
}

module.exports = act;