//This script contains functions needed throughout the whole application.

//The types of data loadFile can feed the successCallback function.
const FILE_READING_MODE = {
	CALLBACK_BLOB: 0,
	READ_TEXT: 1,
	READ_BINARY: 2
};

//This function loads a file using the cordova-plugin-file. Of course, it can only be called after
//the deviceready event is triggered.
function loadFile(path, readingMode, successCallback, errorCallback) {
	resolveLocalFileSystemURL(path, function (entry) {
		entry.file(function (file) {

			if (readingMode === FILE_READING_MODE.CALLBACK_BLOB) {
				successCallback(file);
			} else {
				let reader = new FileReader();
				reader.onload = function() {	
					successCallback(this.result);
				};
				reader.onerror = function() {
					errorCallback(this.error);
				}

				if (readingMode === FILE_READING_MODE.READ_TEXT) {
					reader.readAsText(file);
				} else if (readingMode === FILE_READING_MODE.READ_BINARY) {
					reader.readAsArrayBuffer(file);
				} else {
					errorCallback(new Error("Invalid readingMode value."));
				}
			}

		}, function (err) {
			errorCallback(err);
		});
	}, function(err) {
		errorCallback(err);
	});
}