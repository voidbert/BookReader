let isCordovaInitialized = false;

let bookObject = undefined;
let filePath = "";

let canvas = undefined;
let ctx = undefined;

let pagePosition = { x: 0, y: 0 };
let loadedPages = {};
let currentPage = 0;

//A function that gets called when a book can't be loaded (not readable or corrupt). It will ask the
//user if the book should be removed from the recent books list (and do it if asked to) and go back
//to the page open before the reader.
function goBackOnBadBook(filePath, error) {
	if (confirm("There was an error loading the file! It might have been corrupted or deleted. Do" +
		" you want to remove it from the recently read books list?")) {
		removeBook(filePath);
	}
	console.error(error);
	window.history.back();
}

//Loads a page from a file to memory.
function loadPage(number) {
	//Check if the page has already been loaded
	if (!(number in loadedPages)) {
		//Get the path to the image that will be loaded (replace the JSON book file with the image
		//name based on the pageFormat)
		let lastSlash = filePath.lastIndexOf("/");
		let pagePath = undefined;
		if (lastSlash === -1) {
			pagePath = bookObject.pageFormat.replace("%p", number);
		} else {
			pagePath =
				filePath.slice(0, lastSlash) + "/" + bookObject.pageFormat.replace("%p", number);
		}

		//Load the image.
		loadedPages[number] = new Image();
		loadFile(pagePath, FILE_READING_MODE.DATA_URL, function(url) {
			loadedPages[number].src = url;
		}, function() {
			loadedPages[number].fail = true;
			render(); //Render a "Failed to load page" text
		});
	}
}

//Renders the book pages whenever needed.
function render() {
	loadPage(currentPage);

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (loadedPages[currentPage].fail) {
		//Failed to load the image. Render text in its place.
		ctx.fillStyle = "white";
		ctx.fillText("Failed to load page " + currentPage, canvas.width / 2, canvas.height / 2);
		return;
	} else if (!loadedPages[currentPage].src || !loadedPages[currentPage].complete) {
		//The image hasn't loaded yet. Re-render the page when it loads.
		let interval = setInterval(function() {
			//Page never asked to be loaded or failed to load.
			if (!loadedPages[currentPage] || loadedPages[currentPage].fail) {
				clearInterval(interval);
			}

			if (loadedPages[currentPage].src && loadedPages[currentPage].complete) {
				clearInterval(interval);
				render();
			}
		}, 100);

		//Render a placeholder text for the image
		//TODO - exclude bottom bar's height from calculation of the center
		ctx.fillStyle = "white";
		ctx.fillText("Page " + currentPage, canvas.width / 2, canvas.height / 2);
		return;
	} else {
		//The image has loaded. Render it.
		ctx.drawImage(loadedPages[currentPage], pagePosition.x, pagePosition.y);
	}
}

//Resize the canvas when the window is resized (this is also done when the window is loaded).
function onresize() {
	canvas.width  = window.innerWidth  * window.devicePixelRatio;
	canvas.height = window.innerHeight * window.devicePixelRatio;

	ctx.font = window.devicePixelRatio + "rem sans-serif";
	ctx.textAlign = "center";

	render();
}
window.addEventListener("resize", onresize);
window.addEventListener("load", function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	//Wait for cordova to start before rendering the page
	let interval = setInterval(function() {
		if (isCordovaInitialized) {
			clearInterval(interval);
			onresize();
		}
	}, 100);
});

//Display the file when it can be read from the system's storage.
document.addEventListener("deviceready", function() {
	//Parse the URL to find the book to be opened and the page it should be opened in.
	const urlParams = new URLSearchParams(window.location.search);
	currentPage = urlParams.get("page");
	filePath = urlParams.get("file");
	filePath = filePath.replace("\\", "/");

	if (filePath && currentPage) {
		loadFile(filePath, FILE_READING_MODE.READ_TEXT, function(result) {
			//Parse the JSON book and check if it is a valid book.
			try {
				bookObject = JSON.parse(result);
				if (!checkBook(bookObject))
					throw(new Error("Invalid JSON file (not a book)!"));

				//The book was loaded. Set its cached title.
				setBookTitle(filePath, bookObject.title);

				isCordovaInitialized = true;
			} catch (error) {
				goBackOnBadBook(filePath, error);
			}
		}, function(error) {
			goBackOnBadBook(filePath, error);
		});
	} else {
		alert("No reader arguments error! Please contact the developer telling them what was " +
			"done for the program to get in this invalid state.");
		window.history.back();
	}
}, false);