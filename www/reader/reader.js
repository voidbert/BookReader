let isCordovaInitialized = false;

let bookObject = undefined;
let filePath = "";

let canvas = document.getElementById("canvas");
let ctx = undefined;

let pagePosition = { x: 0, y: 0 };
let pageScale = 1;
let loadedPages = {};
let currentPage = 0;

let touches = {};
let touchAccelerationIntervals = [];
let touchDistanceAvg = 0;

//A function that gets called when a book can't be loaded (not readable or corrupt). It will ask the
//user if the book should be removed from the recent books list (and do it if asked to) and go back
//to the page open before the reader.
function goBackOnBadBook(filePath, error) {
	if (confirm("There was an error loading the file! It might have been corrupted or deleted. Do" +
		" you want to remove it from the recently read books list?")) {
		removeBook(filePath);
	}
	console.error(error);
	AndroidFullScreen.showSystemUI(undefined, undefined);
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

//Converts screen coordinates (of a touch, for example) to page coordinates. Output format:
//{x: ..., y: ...}
function screenToPageCoords(x, y) {
	return {
		x: (x - pagePosition.x) / pageScale,
		y: (y - pagePosition.y) / pageScale
	};
}

//Renders the book pages whenever needed.
function render() {
	loadPage(currentPage);

	ctx.font = window.devicePixelRatio + "rem sans-serif";
	ctx.textAlign = "center";
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
		ctx.drawImage(loadedPages[currentPage], pagePosition.x, pagePosition.y,
			loadedPages[currentPage].width * pageScale, loadedPages[currentPage].height * pageScale
		);
	}
}

//Resize the canvas when the window is resized (this is also done when the window is loaded).
function onresize() {
	canvas.width  = window.innerWidth  * window.devicePixelRatio;
	canvas.height = window.innerHeight * window.devicePixelRatio;
	render();
}
window.addEventListener("resize", onresize);
window.addEventListener("load", function() {
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
	//Put the window in full screen modes
	AndroidFullScreen.immersiveMode(undefined, function() {
		//Don't warn the user and keep running the app in normal mode. Just write to the console.
		console.error("Failed to put the app in full screen");
	});

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
		AndroidFullScreen.showSystemUI(undefined, undefined);
		window.history.back();
	}
}, false);

//When the user leaves the page, return to normal mode
document.addEventListener("backbutton", function() {
	AndroidFullScreen.showSystemUI(undefined, undefined);
	window.history.back();
});

canvas.addEventListener("touchstart", function(e) {
	for (let i = 0; i < e.changedTouches.length; ++i) {
		//dpi adjustment
		let clientX = e.changedTouches[i].clientX * devicePixelRatio;
		let clientY = e.changedTouches[i].clientY * devicePixelRatio;

		//Register the current touch and the file it started in
		touches[e.changedTouches[i].identifier] = {
			x: clientX, y: clientY, lastUpdateTime: Date.now(), velocityX: 0, velocityY: 0
		};

		//If the user touches the page, stop the accelerated touches (these occur when a touch
		//leaves the screen with velocity)
		if (Object.keys(touches).length === 1) {
			for (let i = 0; i < touchAccelerationIntervals.length; ++i) {
				clearInterval(touchAccelerationIntervals[i]);
			}
			touchAccelerationIntervals = [];
		}
	}

	//Reset the distance between fingers.
	touchDistanceAvg = 0;
});

canvas.addEventListener("touchmove", function(e) {
	for (let i = 0; i < e.changedTouches.length; ++i) {
		//dpi adjustment
		let clientX = e.changedTouches[i].clientX * devicePixelRatio;
		let clientY = e.changedTouches[i].clientY * devicePixelRatio;
		let touch = touches[e.changedTouches[i].identifier]; //Name simplification	

		//Calculate the time before the last and the current event for touch velocity calculation.
		let deltaTime = (Date.now() - touches[e.changedTouches[i].identifier].lastUpdateTime) / 100;
		touch.velocityX = ((clientX - touch.x) * 5) / deltaTime;
		touch.velocityY = ((clientY - touch.y) * 5) / deltaTime;

		//Limit the velocity of the touch
		if (touch.velocityX > 0) {
			touch.velocityX = Math.min(750, touch.velocityX);
		} else {
			touch.velocityX = Math.max(-750, touch.velocityX);
		}

		if (touch.velocityY > 0) {
			touch.velocityY = Math.min(750, touch.velocityY);
		} else {
			touch.velocityY = Math.max(-750, touch.velocityY);
		}

		touch.lastUpdateTime = Date.now();
		touch.oldX = touch.x;
		touch.oldY = touch.y;
		touch.x = clientX;
		touch.y = clientY;
	}
	
	//Move the page if there is only one touch
	let keys = Object.keys(touches);
	if (keys.length === 1) {
		pagePosition.x += (touches[keys[0]].x - touches[keys[0]].oldX);
		pagePosition.y += (touches[keys[0]].y - touches[keys[0]].oldY);
		render();
	} else {
		//More than one touch. Calculate the average distance between touches to zoom in and out of
		//the page if that distance has changed. Also calculate the center point between all fingers
		//to zoom into that point.
		let distanceSum = 0;
		let centerX = 0, centerY = 0;
		for (let i = 0; i < keys.length; ++i) {
			for (let j = i + 1; j < keys.length; ++j) {
				distanceSum += Math.sqrt(
					Math.pow(touches[keys[i]].x - touches[keys[j]].x, 2) +
					Math.pow(touches[keys[i]].y - touches[keys[j]].y, 2));
			}

			centerX += touches[i].x;
			centerY += touches[i].y;
		}
		centerX /= keys.length;
		centerY /= keys.length;

		//Convert the screen coordinates to page coordinates.
		let centerTouchPagePosition = screenToPageCoords(centerX, centerY);

		let distanceAvg = distanceSum / (keys.length * keys.length - keys.length); //n^2 - n
		if (touchDistanceAvg !== 0) {
			//Don't zoom if this is the first time the distance is calculated
			pageScale += (distanceAvg - touchDistanceAvg) * pageScale * 0.003;
			pageScale = Math.min(Math.max(pageScale, 0.1), 20); //Limit the zoom's range

			pagePosition.x = centerX - centerTouchPagePosition.x * pageScale;
			pagePosition.y = centerY - centerTouchPagePosition.y * pageScale;
			render();
		}	
		touchDistanceAvg = distanceAvg;	
	}
});

canvas.addEventListener("touchend", function(e) {
	//If the only touch on the page has been lifted, keep moving the page and reducing the speed
	//of the movement until it is minimal.
	let keys = Object.keys(touches);
	if (keys.length === 1) {
		let velocityX = touches[keys[0]].velocityX / 10;
		let velocityY = touches[keys[0]].velocityY / 10;

		let interval = setInterval(function() {
			if (Math.abs(velocityX) < 0.1 && Math.abs(velocityY) < 0.1) {
				//The speed is minimal. Stop adding it to the position.
				touchAccelerationIntervals = touchAccelerationIntervals.filter(function(val) {
					return val !== interval;
				});
				clearInterval(interval);

			}
			pagePosition.x += velocityX;
			pagePosition.y += velocityY;
			velocityX *= 0.95;
			velocityY *= 0.95;
			render();
		}, 10);
		touchAccelerationIntervals.push(interval);
	}

	//Reset the distance between fingers.
	touchDistanceAvg = 0;
	
	//Remove the touches from the list
	for (let i = 0; i < e.changedTouches.length; ++i) {
		delete touches[e.changedTouches[i].identifier];
	}
});