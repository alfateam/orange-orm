function act(c){		
	c.resetChangeSet.expect();
	c.pushCommand.expect(c.beginCommand);

	c.returned = c.sut();
}


module.exports = act;