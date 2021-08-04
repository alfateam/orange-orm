function act(c){
	c.removedRow = {};
	c.parent = {};
	c.extractParentKey.expect(c.joinRelation, c.removedRow).return(c.parent);
	c.tryRemove.expect(c.parent, c.removedRow);

	c.raiseRemoved(c.removedRow);
}

module.exports = act;