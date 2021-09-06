document.addEventListener("deviceready", function() {
	loadFile("file:///storage/emulated/0/file.txt", FILE_READING_MODE.READ_TEXT,
	function(result) {
		document.getElementById("file-contents").textContent = result;
	}, function(error) {
		alert("There was an error loading the file!");
		console.error(error);
	});
}, false);

window.addEventListener("load", function() {
	//Create the dropdown menu for when the user clicks on the kebab menu
	let menu = createDropdownMenu([
		["Settings", function() { window.location = "../settings/settings.html"; }],
		["About", function() { alert("The user clicked on About"); }]
	], "kebab-menu", "kebab-dropdown");

	//The element's position can't be calculated correctly with CSS (or I'm just very bad at it). If
	//the window is resized, the element's position should be updated.
	function updateDropdownPosition() {
		let rect = document.getElementById("header-bar").getBoundingClientRect();
		menu.style.right = (window.innerWidth - rect.right) + "px";
		menu.style.top = rect.bottom + "px";
	}
	window.addEventListener("resize", updateDropdownPosition);
	updateDropdownPosition();

	document.body.appendChild(menu);

	document.getElementById("kebab-menu").contentDocument.addEventListener("click", function() {
		showDropdownMenu(menu);
	});
});