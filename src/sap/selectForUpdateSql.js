module.exports = function(_context, lock) {
	if (lock)
		throw new Error('select for update is not supported by SAP ASE');
	return '';
};
