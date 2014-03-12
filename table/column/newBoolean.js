function newBoolean(filter) {
	var c = {};
	
	c.and = function(other) {
		return filter.append(' AND ').append(other);
	}

	c.or = function(other) {
		return filter.prepend('(').append(' OR ').append(other).append(')');
	}
	
	return c;
}

module.exports = newBoolean;
