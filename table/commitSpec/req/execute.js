function act(c){		
	c.expected = {};
	c.pushCommand.expect(c.commitCommand);
	c.executeChanges.expect().return(c.expected);

	c.returned = c.sut();
}


module.exports = act;