function act(c){
	c.firstCommand = {};
	c.lastCommand = {};
	c.changeSet = [c.firstCommand, c.lastCommand];
	c.expected = {};

	c.getChangeSet.expect().return(c.changeSet);
	c.compressChanges.expect(c.changeSet).return(c.expected);
	
	c.returned = c.sut();
}

module.exports = act;