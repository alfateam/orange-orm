var newId = require('../newId');

function negotiate(connection) {
	var id = newId();	
	if (typeof connection === 'string') 
		return id + connection;	
	
	var c = {};
	for (var prop in connection) {
		c[prop] = connection[prop];
	}

	Object.defineProperty(c, "toJSON", {
        enumerable: false,
        value: toJSON
    });

	function toJSON() {
		return id;
	}
	return c;	
}

module.exports = negotiate;