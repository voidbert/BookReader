//Loads the theme from the storage to display it.
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

	//Dropdown menu to choose theme
	let activator = document.getElementById("theme-dropdown-button");
	let themeMenu = createDropdownMenu(themeDropdownValues, activator, MENU_ALIGNMENT.RIGHT,
		activator, false, onShow, onHide);

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
});