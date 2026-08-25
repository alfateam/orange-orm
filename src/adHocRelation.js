const marker = '__rdbAdHocRelation';

function isAdHocRelation(value) {
	return !!value && typeof value === 'object'
		&& (value[marker] === 'many' || value[marker] === 'one')
		&& typeof value.table === 'string';
}

function newAdHocRelation(kind, table, strategy) {
	return {
		[marker]: kind,
		table,
		strategy: strategy || {}
	};
}

module.exports = {
	marker,
	isAdHocRelation,
	newAdHocRelation
};
