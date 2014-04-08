function act(c){
	c.addedRow = {};
	c.parent = {};
	c.extractParentKey.expect(c.joinRelation, c.addedRow).return(c.parent);
	c.tryAdd.expect(c.parent, c.addedRow);

	c.raiseAdded(c.addedRow);
}

module.exports = act;