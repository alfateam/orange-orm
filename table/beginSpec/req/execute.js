function act(c){		
	c.expected = {};
	c.resetChangeSet.expect();
	c.executeQuery.expect(c.beginCommand).return(c.expected);

	c.returned = c.sut();
}


module.exports = act;