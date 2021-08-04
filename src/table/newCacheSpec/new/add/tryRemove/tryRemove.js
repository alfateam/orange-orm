var parentRow = {};

function act(c){
	c.returned = c.sut.tryRemove([c.cachedValue, c.cachedValue2]);
}
module.exports = act;