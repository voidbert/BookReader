//Display the file when it can be read from the system's storage.
document.addEventListener("deviceready", function() {
	const urlParams = new URLSearchParams(window.location.search);
	let filePath = urlParams.get("file");

	if (filePath) {
		loadFile(filePath, FILE_READING_MODE.READ_TEXT, function(result) {
			document.body.textContent = result;
		}, function(error) {
			if (confirm("There was an error loading the file! Do you want to remove it from the " +
				"recently read books list?")) {
				removeBook(filePath);
			}
			console.error(error);
			window.history.back();
		});
	} else {
		alert("No file provided error! Please contact the developer telling them what was done " +
			"for the program to get in this invalid state.");
	}
}, false);