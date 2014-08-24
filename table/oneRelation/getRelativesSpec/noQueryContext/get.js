function act(c) {
	c.sut(c.parentRow, c.relation).then(onOk,c.mock());

	function onOk(returned) {
		c.returned = returned;
	}
}

module.exports = act;