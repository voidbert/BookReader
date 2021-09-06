document.addEventListener("deviceready", function() {
	
}, false);

//Loads the settings from the storage to display them.
function setThemeText() {
	document.getElementById("theme-dropdown-button").textContent =
		themeDropdownValues[getTheme()][0];
}

//Theme dropdown menu
const themeDropdownValues = [
	["System Default", function() {
		storeTheme(PAGE_THEME.SYSTEM_DEFAULT);
		setThemeText();
		loadTheme(realTheme(getTheme()));	
	}],
	["Light", function() {
		storeTheme(PAGE_THEME.LIGHT);
		setThemeText();
		loadTheme(realTheme(getTheme()));
	}],
	["Dark", function() {
		storeTheme(PAGE_THEME.DARK);
		setThemeText();
		loadTheme(realTheme(getTheme()));
	}]
]

window.addEventListener("load", function() {
	setThemeText();

	//Theme dropdown menu
	let themeMenu = createDropdownMenu(themeDropdownValues, "theme-dropdown-button",
		"theme-dropdown-menu", function() {
			//When the menu is hidden, resize the theme div.
			updateDropdownPosition();
		});

	//The element's position can't be calculated correctly with CSS (or I'm just very bad at it). If
	//the window is resized, the element's position should be updated.
	function updateDropdownPosition() {
		let buttonRect = document.getElementById("theme-dropdown-button").getBoundingClientRect();
		themeMenu.style.right = (window.innerWidth - buttonRect.right) + "px";
		themeMenu.style.top = "calc(" + buttonRect.bottom + "px)";

		//Resize the theme div to fit the menu.
		let container = document.getElementById("app-theme-with-dropdown");
		let containerRect = container.getBoundingClientRect();
		if (themeMenu.style.display === "none") {
			container.style.height = (buttonRect.bottom - containerRect.top) + "px";
		} else {			
			container.style.height =
				(themeMenu.getBoundingClientRect().bottom - containerRect.top) + "px";
		}	
	}
	window.addEventListener("resize", updateDropdownPosition);
	updateDropdownPosition();

	document.body.appendChild(themeMenu);
	document.getElementById("theme-dropdown-button").addEventListener("click",
		function() {
			showDropdownMenu(themeMenu);
			updateDropdownPosition();
		});
});