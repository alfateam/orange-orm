function encodeDate(date) {
	if (date.toISOString)
		return truncate(toISOString(date));
	return truncate(date);
}
function truncate(date) {
	return '\'' + date.substring(0,23) + '\'';
}

function toISOString(date) {
	return date.getFullYear() +
         '-' + pad(date.getMonth()+1) +
         '-' + pad(date.getDate()) +
         'T' + pad(date.getHours()) +
         ':' + pad(date.getMinutes()) +
         ':' + pad(date.getSeconds()) +
         '.' + padMilli(date);
}

function pad(num) {
	var norm = Math.abs(Math.floor(num));
	return (norm < 10 ? '0' : '') + norm;
}

function padMilli(d) {
	return (d.getMilliseconds() + '').padStart(3, '0');
}

module.exports = encodeDate;