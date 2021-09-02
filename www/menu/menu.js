document.addEventListener('deviceready', function() {
	loadFile("file:///storage/emulated/0/file.txt", FILE_READING_MODE.READ_TEXT,
	function(result) {
		document.getElementById("file-contents").textContent = result;
	}, function(error) {
		alert("There was an error loading the file!");
		console.error(error);
	});
}, false);