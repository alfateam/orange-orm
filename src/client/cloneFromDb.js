let dateToISOString = require('../dateToISOString');

function cloneFromDb(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        const arrClone = [];
        for (let i = 0; i < obj.length; i++) {
            arrClone[i] = cloneFromDb(obj[i]);
        }
        return arrClone;
    }
    else if (obj instanceof Date  && !isNaN(obj))
		return dateToISOString(obj); 
    const clone = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        clone[key] = cloneFromDb(obj[key]);
    }
    return clone;
}


module.exports = cloneFromDb;