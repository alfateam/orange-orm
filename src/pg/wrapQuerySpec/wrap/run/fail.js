function act(c){
	c.err = {};
	c.onCompleted.expect(c.err);

	c.onInnerCompleted(c.err);
}

module.exports = act;