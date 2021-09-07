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
});