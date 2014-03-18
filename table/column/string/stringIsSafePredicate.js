function stringIsSafePredicate(value) {
	var norwegianChars = 'æøåÆØÅ124';
	var safeSpecials = 'abc. /@, -';
	var unsafeChars = "ad'\\";
	var pattern = "@"^[@\p{L}\p{N}/,.\- ]+$"";
	return false;
}

module.exports = stringIsSafePredicate;