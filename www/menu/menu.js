let isCordovaInitialized = false;
document.addEventListener("deviceready", function() {
	isCordovaInitialized = true;
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

	//When the plus icon is clicked, open a file dialog and open the chosen file
	document.getElementById("plus-icon").addEventListener("click", function() {
		while (!isCordovaInitialized); //Wait for Apache Cordova to start

		chooser.getFileMetadata("text/plain", function(metadata) {
			if (metadata) {
				FilePath.resolveNativePath(metadata.uri, function(path) {
					window.location.href = "../reader/reader.html?file=" + path;
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