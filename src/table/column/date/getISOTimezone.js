function getISOTimezone(date) {
	var tzo = -date.getTimezoneOffset();
	var dif = tzo >= 0 ? '+' : '-';
	return dif + pad(tzo / 60) + ':' + pad(tzo % 60);
}

function pad(num) {
	var norm = Math.abs(Math.floor(num));
	return (norm < 10 ? '0' : '') + norm;
}

module.exports = getISOTimezone;
