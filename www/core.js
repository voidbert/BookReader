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
					};
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

//A theme that can be applied to the page.
const PAGE_THEME = {
	SYSTEM_DEFAULT: 0,
	LIGHT: 1,
	DARK: 2
}

//Takes in a theme and, if it is SYSTEM_DEFAULT, it is converted to either LIGHT or DARK (based on
//the user's browser preferences).
function realTheme(theme) {
	if (theme === PAGE_THEME.SYSTEM_DEFAULT) {
		if (window.matchMedia("(prefers-color-scheme: light)")) {
			theme = PAGE_THEME.LIGHT;
		} else {
			theme = PAGE_THEME.DARK;
		}
	}
	return theme;
}

//Retrieves the page theme from window.localStorage. If nothing (or an invalid value) is stored,
//SYSTEM_DEFAULT is returned (but not stored).
function getTheme() {
	//Get the theme and convert it to an integer (if possible).
	let theme = window.localStorage.getItem("theme");
	theme = parseInt(theme) || PAGE_THEME.SYSTEM_DEFAULT;
	//If parseInt returns NaN, the default system theme will be seamlessly used.
	return theme;
}

//Saves a PAGE_THEME to window.localStorage.
function storeTheme(pageTheme) {
	window.localStorage.setItem("theme", pageTheme);
}

//Applies a theme to a page. It mustn't be SYSTEM_DEFAULT (use realTheme for converting it to LIGHT
//or DARK).
function loadTheme(theme) {
	//Find every place where the CSS variables for colors need to be changed. This includes all SVG
	//images.
	let styles = [ document.documentElement.style ];
	let svgImages = document.getElementsByClassName("svg-image");
	for (let i = 0; i < svgImages.length; ++i) {
		styles.push(svgImages[i].getSVGDocument().documentElement.style);
	}

	let backgroundColor, foregroundColor, primaryColor, secondaryColor, tertiaryColor;
	switch (theme) {
		case PAGE_THEME.LIGHT:
			backgroundColor = "white";
			foregroundColor = "black";
			primaryColor = "#342b70";
			secondaryColor = "white";
			tertiaryColor = "#978fd3"
			break;
		
		case PAGE_THEME.DARK:
			backgroundColor =  "#100f1c";
			foregroundColor =  "white";
			primaryColor = "#41387D";
			secondaryColor = "white";
			tertiaryColor = "#bbb0ff";
			break;
	}

	for (let i = 0; i < styles.length; ++i) {
		styles[i].setProperty("--background-color", backgroundColor);
		styles[i].setProperty("--foreground-color", foregroundColor);
		styles[i].setProperty("--primary-color", primaryColor);
		styles[i].setProperty("--secondary-color", secondaryColor);
		styles[i].setProperty("--tertiary-color", tertiaryColor);
	}
}

//Load the theme when the page starts.
window.onload = function () {
	loadTheme(realTheme(getTheme()));
}