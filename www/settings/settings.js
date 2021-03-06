let isCordovaInitialized = false;
document.addEventListener("deviceready", function() {
	isCordovaInitialized = true;
}, false);

//Loads the theme from the storage to display it in its button.
function setThemeText() {
	document.getElementById("theme-dropdown-button").textContent =
		themeDropdownValues[getTheme()].text;
}

//Stores a theme, loads it and modifies the settings option showing the current theme.
function updateTheme(theme) {
	storeTheme(theme);
	setThemeText();
	loadTheme(realTheme(theme));	
}

//Loads the haptic feedback info from storage to display it in its button.
function setHapticFeedback() {
	let feedback = window.localStorage.getItem("haptic-feedback");
	let feedbackButton = document.getElementById("haptic-feedback");
	if (feedback === "True") {
		feedbackButton.textContent = "On";
	} else {
		feedbackButton.textContent = "Off";
	}
}

const themeDropdownValues = [
	{
		text: "System Default",
		clickCallback: function(el) { updateTheme(PAGE_THEME.SYSTEM_DEFAULT); el.updatePosition(); }
	},
	{
		text: "Light",
		clickCallback: function(el) { updateTheme(PAGE_THEME.LIGHT); el.updatePosition(); }
	},
	{
		text: "Dark",
		clickCallback: function(el) { updateTheme(PAGE_THEME.DARK); el.updatePosition(); }
	},
];

window.addEventListener("load", function() {
	setThemeText();
	setHapticFeedback();

	//Dropdown menu to choose theme
	let activator = document.getElementById("theme-dropdown-button");
	let themeMenu = createDropdownMenu(themeDropdownValues, activator, MENU_ALIGNMENT.RIGHT,
		activator, onShow, onHide);

	//Move the bottom border with the changing of the settings dropdown menu status
	let container = document.getElementById("app-theme-with-dropdown");
	function onShow() {
		let containerRect = container.getBoundingClientRect();
		let activatorRect = activator.getBoundingClientRect();
		container.style.height =
			(themeMenu.getBoundingClientRect().bottom - containerRect.top) + "px";
	}

	function onHide() {
		let containerRect = container.getBoundingClientRect();
		let activatorRect = activator.getBoundingClientRect();
		container.style.height = (activatorRect.bottom - containerRect.top) + "px";
	}
	onHide();

	//Haptic feedback toggle
	document.getElementById("haptic-feedback").addEventListener("click", function() {
		let feedback = window.localStorage.getItem("haptic-feedback");
		if (feedback === "True") {
			window.localStorage.setItem("haptic-feedback", "False");
		} else {
			window.localStorage.setItem("haptic-feedback", "True");
		}
		setHapticFeedback();
	});

	//Clear recent files data button
	document.getElementById("clear-data").addEventListener("click", function() {
		if (confirm("Are you sure you want me to forget what books you read recently?")) {
			while (!isCordovaInitialized); //Wait for Apache Cordova to start
			window.localStorage.setItem("book-list", "{}");
			plugins.toast.show("Data cleared!", "short", "bottom");
		}
	});
});