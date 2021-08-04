function act(c){
	c.parameters = {foo: "bar"};
	try {
		c.sut(c.parameters);
	} catch(e) {
		c.thrownMessage = e.message;
	}
}

module.exports = act;