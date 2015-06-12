var getISOTimezone = require('./getISOTimezone');

function toISOString(date) {
	return date.getFullYear() 
        + '-' + pad(date.getMonth()+1)
        + '-' + pad(date.getDate())
        + 'T' + pad(date.getHours())
        + ':' + pad(date.getMinutes()) 
        + ':' + pad(date.getSeconds()) 
        + '.' + pad(date.getMilliseconds())
        + getISOTimezone();
}

function pad(num) {
	var norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
};



module.exports = toISOString;