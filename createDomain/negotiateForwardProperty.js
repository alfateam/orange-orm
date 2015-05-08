function negotiateForwardProperty(oldDomain, newDomain, propertyName) {
	if(newDomain[propertyName]) return;
	Object.defineProperty(newDomain, propertyName, {
		enumerable: true,
		get: createGetter(oldDomain, propertyName),
		set: createSetter(oldDomain, propertyName)
	});
}

function createGetter(oldDomain, propName) {
	return function() {
		return oldDomain[propName];
	};
}

function createSetter(oldDomain, propName) {
	return function(value) {
		oldDomain[propName] = value;
	};
}

module.exports = negotiateForwardProperty;