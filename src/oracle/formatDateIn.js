function formatDateColumn(value) {
	return `TO_TIMESTAMP(${value}, 'YYYY-MM-DD"T"HH24:MI:SS.FF3')`;
}

module.exports = formatDateColumn;