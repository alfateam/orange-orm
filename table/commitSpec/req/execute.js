function act(c){		
	c.expected = {};
	c.pushCommand.expect(c.commitCommand);

	c.commitPromise = {};
	c.flush.expect().return(c.commitPromise);

	c.commitPromise.then = c.mock();
	c.commitPromise.then.expect(c.releaseDbClient).return(c.expected);

	c.returned = c.sut();
}


module.exports = act;