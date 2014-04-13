function act(c) {
	c.otherColumn = {};
	c.otherAlias = 'other';
	c.otherColumn.alias = c.otherAlias;
	c.raiseFieldChanged(c.row, c.otherColumn);
}

module.exports = act;