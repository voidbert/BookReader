#!/usr/bin/env node
//This script is run after "prepare" and it removes the INTERNET permission from AndroidManifest.xml

const manifestPath = "platforms/android/app/src/main/AndroidManifest.xml";

var fs = require("fs");
fs.readFile(manifestPath, "utf8", function(err, contents) {
	if (err) {
		console.error(err);
		return 1;
	} else {
		contents = contents.replace(
			"<uses-permission android:name=\"android.permission.INTERNET\" />", "");
		fs.writeFile(manifestPath, contents, "utf8", function(err) {
			if (err) {
				console.error(err);
				return 1;
			}
		})
	}
});