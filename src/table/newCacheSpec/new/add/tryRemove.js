var parentRow = {};

function act(c){
	c.emitRemoved.expect(c.result);
	c.returned = c.sut.tryRemove([c.cachedValue, c.cachedValue2]);
}
module.exports = act;