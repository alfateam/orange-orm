let nextId = 1;

module.exports = function newMemoryId() {
	return `tmp${nextId++}`;
};
