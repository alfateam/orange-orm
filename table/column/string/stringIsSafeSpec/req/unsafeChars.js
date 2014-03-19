function act(c){
	c.unsafeChars = 'ad\'\\';	
	
	c.returned = c.sut(c.unsafeChars);
}

module.exports = act;