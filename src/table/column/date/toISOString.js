var getISOTimezone = require('./getISOTimezone');

function toISOString(date) {
	return date.getFullYear() +
         '-' + pad(date.getMonth()+1) +
         '-' + pad(date.getDate()) +
         'T' + pad(date.getHours()) +
         ':' + pad(date.getMinutes()) +
         ':' + pad(date.getSeconds()) +
         '.' + padMilli(date) +
         getISOTimezone(date);
}

function padMilli(d) {
	return (d.getMilliseconds() + '').padStart(3, '0');
}

function pad(num) {
	var norm = Math.abs(Math.floor(num));
	return (norm < 10 ? '0' : '') + norm;
}



module.exports = toISOString;