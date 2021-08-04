function act(c){
	c.key = '1234567890';
	c.expected = c.key;
	
	c.returned =  c.sut(c.key);
}

module.exports = act;