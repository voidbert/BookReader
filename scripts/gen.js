#!/usr/bin/env node

//This script (re)creates the development environment after it is cleaned. It adds Apache Cordova's
//plugins and platforms (Apache licensed code). That's why these aren't included with the MIT
//licensed application source code and they need to be added separately.

const platforms = [ "android" ];
const plugins =
[
	"cordova-plugin-file",
	"cordova-plugin-android-permissions",
	"cordova-plugin-chooser",
	"cordova-plugin-filepath",
	"cordova-plugin-x-toast"
];

function main() {
	const { cdProjectRoot, runCommand } = require("./core");

	cdProjectRoot();

	//Add the platforms
	for (let i = 0; i < platforms.length; ++i) {
		if (runCommand("cordova", [ "platform", "add", platforms[i] ]) !== 0) {
			console.error("Failed to add platform " + platforms[i]);
			process.exit(1);
		}
	}

	//Add the plugins
	for (let i = 0; i < plugins.length; ++i) {
		if (runCommand("cordova", [ "plugin", "add", plugins[i] ]) !== 0) {
			console.error("Failed to add plugin " + plugins[i]);
			process.exit(1);
		}
	}
}

if (require.main === module) {
	main();
}