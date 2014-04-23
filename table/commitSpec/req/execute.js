function act(c){		
	c.expected = {};
	c.changes = {};
	c.pushCommand.expect(c.commitCommand);
	c.popChanges.expect().return(c.changes);

	c.commitPromise = {};
	c.executeChanges.expect(c.changes).return(c.commitPromise);

	c.commitPromise.then = c.mock();
	c.commitPromise.then.expect(c.releaseDbClient).return(c.expected);

	c.returned = c.sut();
}


module.exports = act;