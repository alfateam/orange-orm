function act(c){
	c.deletedRow = {};
	c.parent = {};
	c.extractParentKey.expect(c.joinRelation, c.deletedRow).return(c.parent);
	c.tryRemove.expect(c.parent, c.deletedRow);

	c.raiseDeleted(c.deletedRow);
}

module.exports = act;