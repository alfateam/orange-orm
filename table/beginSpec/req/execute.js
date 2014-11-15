function act(c){		
	c.expected = {};
	c.setSessionSingleton.expect('changes', []);
	c.executeQuery.expect(c.beginCommand).return(c.expected);

	c.returned = c.sut();
}


module.exports = act;