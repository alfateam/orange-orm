function act (c) {
	c.sut(c.relation, c.parent).then(onResult);

	function onResult(returned) {
		c.returned = returned;
	}

}

module.exports = act;