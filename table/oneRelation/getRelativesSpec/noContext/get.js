function act (c) {
	c.sut(c.relation, c.parent).then(onResult);

	function onResult(returned) {
		c.didNotCrash = true;
	}

}

module.exports = act;