#!/usr/bin/env node

//This script is run after "prepare" and it removes the INTERNET permission from AndroidManifest.xml
//It also adds android:requestLegacyExternalStorage="true" for newer Android versions.

const manifestPath = "platforms/android/app/src/main/AndroidManifest.xml";

const { readFile, writeFile } = require("fs");
readFile(manifestPath, "utf8", function(err, contents) {
	if (err) {
		console.error("Failed to load " + manifestPath);
		process.exit(1);
	} else {
		contents = contents.replace(
			"<uses-permission android:name=\"android.permission.INTERNET\" />", "");

		//TODO - stop using a dirty trick to add this option. Use an XML parser.
		if (contents.indexOf("android:requestLegacyExternalStorage=\"true\"") === -1) {
			contents = contents.replace(
				"<application",
				"<application android:requestLegacyExternalStorage=\"true\""
			);
		}
		writeFile(manifestPath, contents, "utf8", function(err) {
			if (err) {
				console.error("Failed to write to " + manifestPath);
				process.exit(1);
			}
		})
	}
});