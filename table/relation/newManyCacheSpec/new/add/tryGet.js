var parentRow = {};

function act(c){
	parentRow[c.alias] = c.cachedValue;
	parentRow[c.alias2] = c.cachedValue2;

	c.returned = c.sut.tryGet(parentRow);
}
module.exports = act;