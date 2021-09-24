//This script contains functions needed throughout the whole application.

//The types of data loadFile can feed the successCallback function.
const FILE_READING_MODE = {
	CALLBACK_BLOB: 0,
	READ_TEXT: 1,
	READ_BINARY: 2,
	DATA_URL: 3
};

//This function loads a file using the cordova-plugin-file (from a path). Of course, it can only be
//called after the deviceready event is triggered.
function loadFile(path, readingMode, successCallback, errorCallback) {
	//Loads the file after it is confirmed that the app has permission to do it.
	function loadWithPermission() {
		resolveLocalFileSystemURL(path, function (entry) {
			entry.file(function (file) {
				readFile(file, readingMode, successCallback, errorCallback);
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

//Reads the contents of a File object. Files obtained from <input type="file"> can be read using
//this function.
function readFile(file, readingMode, successCallback, errorCallback) {
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
		} else if (readingMode === FILE_READING_MODE.DATA_URL) {
			reader.readAsDataURL(file);
		} else {
			errorCallback(new Error("Invalid readingMode value."));
		}
	}
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
			primaryColor = "#41387d";
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

//How a dropdown menu can be aligned in relation to its activator
const MENU_ALIGNMENT = { LEFT: 0, RIGHT: 1 };
//How a menu is (shown or hidden)
const MENU_STATUS = { HIDDEN: 0, SHOWN: 1 };

/*
Creates a dropdown menu DOM element (initially hidden) and adds it to the body. The menu's
contents is a list of objects like the following one (the icon being optional):
{ text: "Text to display", icon: "path to SVG", clickCallback: function(element) {} }

The activator refers to the element that, when clicked, will trigger the menu to appear.
addEventListener will be called for this element.

alignment must be a MENU_ALIGNMENT, so that the element is kept in position.

isObject should be true if the activator is an <object> element (like an SVG image, for example).

alignmentReference is the element the menu should be aligned to.

Some properties are added to the element:
 - activator: the activator argument
 - alignmentReference: the alignmentReference argument
 - updatePosition: a function that can be called to re-align the menu. This should be called if the
activator changes in size.
 - onShowCallback: a function that gets called when the element is shown (between the removal of
display: none and the setting of opacity to 0)
 - onHideCallback: a function that gets called when the element is hidden (before setting opacity to
0 and display to "none")
 - status: if the menu is hidden or shown

The created menu element is returned.
*/
function createDropdownMenu(contents, activator, alignment, alignmentReference, isObject = false,
	onShowCallback = function() {}, onHideCallback = function() {}) {

	//Create the element, style it and make it hidden
	let menu = document.createElement("div");
	menu.className = "dropdown-menu";

	menu.style.display = "none";
	menu.style.opacity = "0";

	menu.activator = activator;
	menu.alignmentReference = alignmentReference;
	menu.onShowCallback = onShowCallback;
	menu.onHideCallback = onHideCallback;
	menu.status = MENU_STATUS.HIDDEN;

	//Activator click event handling (show the menu)
	let activatorClickObject = activator
	if (isObject)
		activatorClickObject = activatorClickObject.contentDocument;

	activatorClickObject.addEventListener("click", function() {
		menu.style.removeProperty("display");
		//Wait for the display property to take effect to turn on the opacity transition.
		while (getComputedStyle(menu).display === "none");
		onShowCallback();
		menu.style.opacity = "1";
		menu.status = MENU_STATUS.SHOWN;
	});

	//When the user clicks somewhere but the activator, hide the menu.	
	window.addEventListener("click", function(e) {
		if (e.target !== activator && menu.status === MENU_STATUS.SHOWN) {
			onHideCallback();
			menu.style.opacity = "0";
			//Wait for the opacity transition to end to stop displaying the menu.
			menu.ontransitionend = function() {
				menu.style.display = "none";
				menu.status = MENU_STATUS.HIDDEN;
				//Don't hide the menu when it is activated (opacity transition to 1)
				menu.ontransitionend = function() {}
			};
		}
	});

	//Keep the menu left / right aligned in relation to its activator. Re-adjust the menu when the
	//window is resized
	function updatePosition() {
		let rect = alignmentReference.getBoundingClientRect();
		menu.style.top = rect.bottom + "px";

		if (alignment === MENU_ALIGNMENT.LEFT) {
			menu.style.left = rect.left + "px";
		} else {
			menu.style.right = (window.innerWidth - rect.right) + "px";
		}
	}
	window.addEventListener("resize", updatePosition);
	menu.updatePosition = updatePosition;
	updatePosition();

	//Add all dropdown items
	for (let i = 0; i < contents.length; ++i) {
		let menuItem = document.createElement("div");
		menuItem.className = "dropdown-menu-item";

		//Add the icon if there's one
		if (contents[i].icon) {
			let menuItemIcon = document.createElement("object");
			menuItemIcon.classList.add("svg-image");
			menuItemIcon.classList.add("dropdown-menu-item-icon");

			menuItemIcon.data = contents[i].icon;
			menuItem.appendChild(menuItemIcon);
		}

		//Add the text and the onclick callback
		let menuItemText = document.createElement("div");
		menuItemText.textContent = contents[i].text;
		menuItem.appendChild(menuItemText);
		menuItem.addEventListener("click", function() { contents[i].clickCallback(menu); });

		menu.appendChild(menuItem);
	}

	document.body.appendChild(menu);
	return menu;
}

//Returns the dictionary of books stored in window.localStorage. If the value doesn't exist / is
//invalid in storage, {} is stored and returned. List structure:
//{ fileName: {lastOpened: UNIX Time, bookTitle: Title, page: number of last open page}, ... }
function loadBookList() {
	let list = window.localStorage.getItem("book-list");
	if (list === null) {
		//First time running the app. Initializer the storage.
		window.localStorage.setItem("book-list", "{}");
		list = "{}";
	}

	try {
		list = JSON.parse(list);
	} catch {
		console.error("Error parsing book-list JSON");
		//Silently reset the list of books.
		window.localStorage.setItem("book-list", "{}");
		return {};
	}

	return list;
}

//Opens a book in the reader and stores the current moment as the last opened timestamp.
function openBook(filepath, isNewFile = false) {
	//Update / add the file with the current time.
	let list = loadBookList();
	if (filepath in list) {
		//The book has already been added to the list. Just modify its last opened timestamp.
		list[filepath].lastOpened = Date.now();
	} else {
		//The book was never open. Add it to the list. First, get the name of the file as a
		//temporary title (before the JSON of the book is loaded).
		let filepathReplacedSlashes = filepath.replace("\\", "/");
		let splitPath = filepathReplacedSlashes.split("/");
		let name = splitPath[splitPath.length - 1].split(".")[0];

		list[filepath] = { lastOpened: Date.now(), bookTitle: name, page: 1};
	}
	window.localStorage.setItem("book-list", JSON.stringify(list));
	
	//Open the book with the reader.
	window.location.href = "../reader/reader.html?file=" + filepath + "&page=" + list[filepath].page;
}

//Stores the title for a book (text that will be displayed in the menu).
function setBookTitle(filepath, title) {
	let list = loadBookList();
	list[filepath].bookTitle = title;
	window.localStorage.setItem("book-list", JSON.stringify(list));
}

//Stores the number of last book page the user was reading. 
function setBookLastPage(filepath, page) {
	let list = loadBookList();
	list[filepath].page = page;
	window.localStorage.setItem("book-list", JSON.stringify(list));
}

//Removes a book from the list of recently read books.
function removeBook(filepath) {
	let list = loadBookList();
	delete list[filepath];
	window.localStorage.setItem("book-list", JSON.stringify(list));
}

//Checks if the contents of an object parsed from a JSON file are valid (contain the needed fields).
function checkBook(bookObject) {
	let keys = Object.keys(bookObject);
	return keys.includes("title") && keys.includes("pageFormat") && keys.includes("pageCount");
}

//Load the theme when the page starts.
window.addEventListener("load", function () {
	loadTheme(realTheme(getTheme()));
});