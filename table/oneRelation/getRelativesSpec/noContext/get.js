function act (c) {
	c.sut(c.parent, c.relation).then(onResult);

	function onResult(returned) {
		c.didNotCrash = true;
	}

}

module.exports = act;