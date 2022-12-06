function dateToISOString(date) {
	let tzo = -date.getTimezoneOffset();
	let dif = tzo >= 0 ? '+' : '-';

	function pad(num) {
		let norm = Math.floor(Math.abs(num));
		return (norm < 10 ? '0' : '') + norm;
	}

	function padMilli(d) {
		return (d.getMilliseconds() + '').padStart(3, '0');
	}

	return date.getFullYear() +
		'-' + pad(date.getMonth() + 1) +
		'-' + pad(date.getDate()) +
		'T' + pad(date.getHours()) +
		':' + pad(date.getMinutes()) +
		':' + pad(date.getSeconds()) +
		'.' + padMilli(date) +
		dif + pad(tzo / 60) +
		':' + pad(tzo % 60);
}

module.exports = dateToISOString;
