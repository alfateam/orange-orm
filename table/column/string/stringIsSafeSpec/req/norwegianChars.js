function act(c){
	c.norwegianChars = 'aæøåÆØÅ124';
	
	c.returned = c.sut(c.norwegianChars);
}

module.exports = act;