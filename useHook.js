let preferHook = true;
let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);

module.exports = preferHook && major > 7;