function act(c){
	c.safeSpecials = 'abc. /@, -+';
	
	c.returned = c.sut(c.safeSpecials);
}

module.exports = act;