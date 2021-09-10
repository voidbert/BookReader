let isCordovaInitialized = false;
document.addEventListener("deviceready", function() {
	isCordovaInitialized = true;
}, false);

//Returns the dictionary of books stored in window.localStorage. If the value doesn't exist / is
//invalid in storage, {} is stored and returned. List structure:
//{ fileName: {lastOpened: UNIX Time}, ... }
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

//Loads the books in window.localStorage and places them in the menu's grid.
function loadGrid() {
	//Load and sort the list by the most recent date before presenting it.
	let list = loadBookList();
	let keys = Object.keys(list);
	keys.sort(function(a, b) {
		return list[b].lastOpened - list[a].lastOpened;
	});

	//Display the list
	let bookGrid = document.getElementById("book-grid");
	for (let i = 0; i < keys.length; ++i) {
		let item = document.createElement("div");
		item.className = "book-grid-icon";

		let img = document.createElement("img");
		img.className = "book-grid-icon-img";
		img.src = "../coreArt/test.png";
		item.appendChild(img);

		let text = document.createElement("div");
		text.className = "book-grid-icon-text";

		//Get the name of the file
		keys[i].replace("\\", "/");
		let splitPath = keys[i].split("/");
		let name = splitPath[splitPath.length - 1].split(".")[0];

		text.textContent = name;
		item.appendChild(text);

		item.addEventListener("click", function() {
			openBook(keys[i]);
		});
		bookGrid.appendChild(item);
	}
}

//Opens a book in the reader and stores the current moment as the last opened timestamp.
function openBook(filepath) {
	//Update / add the file with the current time.
	let list = loadBookList();
	list[filepath] = { lastOpened: Date.now() };
	window.localStorage.setItem("book-list", JSON.stringify(list));

	//Open the book with the reader.
	window.location.href = "../reader/reader.html?file=" + filepath;
}

window.addEventListener("load", function() {
	loadGrid();

	//Create the dropdown menu for when the user clicks on the kebab menu
	let menu = createDropdownMenu([
		{
			text: "Settings",
			clickCallback: function() { window.location = "../settings/settings.html"; }
		},
		{
			text: "About",
			clickCallback: function() { alert("The user clicked on About"); }
		}
	], document.getElementById("kebab-menu"), MENU_ALIGNMENT.RIGHT,
	document.getElementById("header-bar"), true);

	//When the plus icon is clicked, open a file dialog and open the chosen file
	document.getElementById("plus-icon").addEventListener("click", function() {
		while (!isCordovaInitialized); //Wait for Apache Cordova to start

		chooser.getFileMetadata("text/plain", function(metadata) {
			if (metadata) {
				FilePath.resolveNativePath(metadata.uri, function(path) {
					openBook(path);
				}, function(error) {
					alert("Failed to open the file!");
					console.error(error);
				});
			}
		}, function() {
			alert("Error opening file picker!");
		});
	});
});