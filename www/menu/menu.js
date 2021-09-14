let isCordovaInitialized = false;
document.addEventListener("deviceready", function() {
	isCordovaInitialized = true;
}, false);

//Keep track of the touches and currently selected books currently in the page. Also keep track of
//all timers started with setTimeout. They must be stopped on scrolling to prevent bugs.
let touches = {};
let selectedBooks = [];
let timers = [];

//Cancels all setTimeout events.
function clearTimers() {
	timers.forEach(function(timer) {
		clearTimeout(timer);
	});
	timers = [];
}

//Adds/removes a book to/from the selected books depending on if it is in there already. If not in
//selection mode, this function will enable it. Selection mode can also be disable if the last
//selected book is removed. This function also cancels all setTimeouts.
function toggleBookSelection(filepath) {
	//Find the grid element for the book to change its style.
	let gridElement = Array.from(document.getElementsByClassName("book-grid-icon"))
		.filter(function(val) {
		return val.filepath === filepath;
	})[0];

	if (selectedBooks.indexOf(filepath) === -1) {
		selectedBooks.push(filepath); //Book not in the selected list. Add it.
		gridElement.classList.add("book-grid-icon-selected");
		document.getElementById("remove").style.opacity = "1";
	} else {
		selectedBooks = selectedBooks.filter(function(val) {
			return val !== filepath;
		}); //Already in array. Remove the item and style the element.
		gridElement.classList.remove("book-grid-icon-selected");

		//If the last book was removed, disable selection mode
		if (selectedBooks.length === 0) {
			leaveSelectionMode();
		}
	}
	clearTimers();
}

//Hides the remove button and unselects all books.
function leaveSelectionMode() {
	selectedBooks = [];
	document.getElementById("remove").style.removeProperty("opacity");

	//Unstyle all selected elements.
	let gridElements = Array.from(document.getElementsByClassName("book-grid-icon"));
	for (let i = 0; i < gridElements.length; ++i) {
		gridElements[i].classList.remove("book-grid-icon-selected");
	}
}

function inSelectionMode() { return selectedBooks.length > 0; }

//Based on the client coordinates in pixels of a touch input, this function will loop through every
//book on the grid, checking if the coordinates given are inside any of the rectangles defined by
//those elements. If so, the element hovered is returned. If not, undefined is returned.
function getTouchHoverBook(x, y) {
	let gridBooks = Array.from(document.getElementsByClassName("book-grid-icon"));
	for (let i = 0; i < gridBooks.length; ++i) {
		let rect = gridBooks[i].getBoundingClientRect();
		if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
			return gridBooks[i];
		}
	}
	return undefined;
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
		item.filepath = keys[i];

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

		//Event listeners (click to open book normally or to add it to the selection if in selection
		//mode)
		item.addEventListener("click", function() {
			if (inSelectionMode()) {
				toggleBookSelection(keys[i]);
			} else {
				openBook(keys[i]);
			}
		});

		bookGrid.appendChild(item);
	}
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

	//Remove all selected books from recents list when the remove button is clicked
	document.getElementById("remove").getSVGDocument().documentElement.addEventListener("click",
		function() {
		if (confirm("Are you sure you want to remove the selected books from the recent books " +
			"list?")) {
			//Remove selected books from displayed grid.
			let gridChildren = Array.from(document.getElementsByClassName("book-grid-icon"));
			for (let i = 0; i < gridChildren.length; ++i) {
				if (selectedBooks.indexOf(gridChildren[i].filepath) !== -1) {
					gridChildren[i].parentElement.removeChild(gridChildren[i]);
				}
			}

			//Remove selected books from the stored recents list.
			for (let i = 0; i < selectedBooks.length; ++i) {
				removeBook(selectedBooks[i]);
			}
			leaveSelectionMode();
		}
	});

	//Long touch a book to bring up the remove from recents button.
	window.addEventListener("touchstart", function(e) {
		for (let i = 0; i < e.changedTouches.length; ++i) {
			//Register the current touch and the file it started in
			touches[e.changedTouches[i].identifier] =
				{      x: e.changedTouches[i].clientX,      y: e.changedTouches[i].clientY,
				  startX: e.changedTouches[i].clientX, startY: e.changedTouches[i].clientY
				};
			let currentTouch = touches[e.changedTouches[i].identifier]; //Ease of naming

			//Test every book in the grid to see if the finger is inside it
			let bookIcon = getTouchHoverBook(currentTouch.x, currentTouch.y);
			if (bookIcon) {
				//Finger in a book.
				currentTouch.startElementFilepath = bookIcon.filepath;

				//When 500ms pass, check if there has been a long touch.
				timers.push(setTimeout(function() {
					let bookIconFinal = getTouchHoverBook(currentTouch.x, currentTouch.y);
					if (bookIconFinal) {
						if (currentTouch.startElementFilepath === bookIconFinal.filepath) {
							//The touch is inside the book. Check if the movement inside the book
							//wasn't much and if there's only one finger on the screen.
							if (Object.keys(touches).length === 1 &&
								Math.abs(currentTouch.x - currentTouch.startX) <= 10 &&
								Math.abs(currentTouch.y - currentTouch.startY) <= 10) {

								toggleBookSelection(bookIconFinal.filepath);

								//Vibrate if haptic feedback is enabled
								if (window.localStorage.getItem("haptic-feedback") === "True") {
									//Wait for Apache Cordova to start before vibrating
									while (!isCordovaInitialized);
									navigator.vibrate(100);
								}
							}
						}
					} else {
						//The finger left the book. Ignore it.
					}	
				}, 500));
			} else {
				currentTouch.startElementFilepath = ""; //Touch not on any book
			}
		}
	});

	window.addEventListener("touchmove", function(e) {
		for (let i = 0; i < e.changedTouches.length; ++i) {
			touches[e.changedTouches[i].identifier].x = e.changedTouches[i].clientX;
			touches[e.changedTouches[i].identifier].y = e.changedTouches[i].clientY;
		}
	});

	window.addEventListener("touchend", function(e) {
		for (let i = 0; i < e.changedTouches.length; ++i) {
			delete touches[e.changedTouches[i].identifier];
		}
	});

	//Leave the selection mode when clicking on the back arrow. If not in selection mode, leave the
	//app.
	document.addEventListener("backbutton", function(e) {
		if (inSelectionMode()) {
			e.preventDefault();
			leaveSelectionMode();
		} else {
			navigator.app.exitApp();
		}
	}, false);

	//Stop any long touch when the user scrolls the page. Without this, many bugs could occur.
	document.addEventListener("scroll", function() { clearTimers(); });
});