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

	//Loads the file after it is confirmed that the app has permission to do it.
	function loadWithPermission() {
		//Load the file
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

	//Ask for permission to access files if the app doesn't have it
	let permissions = cordova.plugins.permissions;
	permissions.checkPermission(permissions.READ_EXTERNAL_STORAGE, function(status) {
		if (status.hasPermission) {
			loadWithPermission();
		} else {
			//No permission. Request it.
			permissions.requestPermission(permissions.READ_EXTERNAL_STORAGE, function(status) {
				if (status.hasPermission) {
					loadWithPermission();
				}
				else {
					errorCallback(new Error("Failed to request permission to read files."));
				}
			}, function() {
				errorCallback(new Error("Failed to request permission to read files."));
			})
		}
	}, function() {
		errorCallback(new Error("Failed to check file reading permission."));
	});
}