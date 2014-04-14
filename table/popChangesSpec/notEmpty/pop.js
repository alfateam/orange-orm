function act(c){
	c.firstCommand = {};
	c.lastCommand = {};
	c.lastCommand.endEdit = c.mock();
	c.lastCommand.endEdit.expect();
	c.changeSet = [c.firstCommand, c.lastCommand];
	c.domain[c.changeSetId] = c.changeSet;
	c.returned = c.sut();
}

module.exports = act;