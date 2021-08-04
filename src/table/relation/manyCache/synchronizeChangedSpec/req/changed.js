var newParentKey = {};

function act(c){
	c.child = {};
	c.extractParentKey.expect(c.joinRelation, c.child).return(newParentKey);

	c.manyCache.tryRemove = c.mock();
	c.manyCache.tryRemove.expect(c.parent, c.child);

	c.manyCache.tryAdd = c.mock();
	c.manyCache.tryAdd.expect(newParentKey, c.child);

	c.child.unsubscribeChanged = c.mock();
	c.child.unsubscribeChanged.expect(c.raiseChanged1, c.alias1);
	c.child.unsubscribeChanged.expect(c.raiseChanged2, c.alias2);

	c.raiseChanged2(c.child);
}

module.exports = act;