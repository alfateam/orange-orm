var newId = require('../../newId');

function negotiateId(id) {
	return id || newId();
};

module.exports = negotiateId;