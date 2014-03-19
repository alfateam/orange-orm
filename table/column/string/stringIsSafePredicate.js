function stringIsSafePredicate(value) {
	return true;
	// var norwegianChars = 'æøåÆØÅ124';
	// var safeSpecials = 'abc. /@, -';
	// var unsafeChars = "ad'\\";
	// var pattern = "@"^[@\p{L}\p{N}/,.\- ]+$"";
}

module.exports = stringIsSafePredicate;