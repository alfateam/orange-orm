var newParentKey = {};

function act(c){
	c.extractParentKey.expect(c.joinRelation, c.child).return(newParentKey);

	c.manyCache.tryRemove = c.mock();
	c.manyCache.tryRemove.expect(c.parent, c.child);

	c.manyCache.tryAdd = c.mock();
	c.manyCache.tryAdd.expect(newParentKey, c.child);

	c.child.unsubscribeChanged = c.mock();
	c.child.unsubscribeChanged.expect(c.alias1, c.raiseChanged1);
	c.child.unsubscribeChanged.expect(c.alias2, c.raiseChanged2);

	c.raiseChanged2();
}

module.exports = act;