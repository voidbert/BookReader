#!/usr/bin/env node

//This script cleans the development environment by deleting everything but the needed files and
//folders. If you need any file or directory not to be deleted, add it to the following list.
let crucialDirectories = [ "scripts", "www", "config.xml", "package.json", "README.md", "LICENSE",
	".gitignore", ".git" ];

//This script also removes Cordova platforms and plugins.

function main() {
	const { cdProjectRoot, prompt } = require("./core");
	const { readFile, writeFile, readdir, rm } = require("fs");

	//User confirmation
	prompt("This action will delete files. Continue? (Y/n) ", function(answer) {
		if (answer === "Y" || answer === "y"){
			cdProjectRoot();

			//Cordova cleanup (plugin and platform removal). Parse the package.json file to list the
			//plugins and platforms to remove.
			readFile("package.json", "utf8", function(err, contents) {
				if (err) {
					console.error("Failed to load package.json");
					process.exit(1);
				} else {
					try {
						let parsedJSON = JSON.parse(contents);

						try {
							parsedJSON.devDependencies   = {};
							parsedJSON.cordova.plugins   = {};
							parsedJSON.cordova.platforms = [];
							contents = JSON.stringify(parsedJSON, null, "\t");
						} catch {
							console.error("Failed to modify the contents of package.json");
							process.exit(1);
						}

						writeFile("package.json", contents, "utf8", function(err) {
							if (err) {
								console.error("Failed to write package.json to disk");
								process.exit(1);
							}
						});
					} catch {
						console.error("Failed to parse package.json");
						process.exit(1);
					}
				}
			});

			//Delete extra files and directories (while package.json is simultaneously modified)
			readdir(".", function(err, files) {
				if (err) {
					console.error("Error listing the repository's root directory");
				} else {
					for (let i = 0; i < files.length; ++i) {
						if (crucialDirectories.indexOf(files[i]) === -1) { //If not in crucial list
							rm(files[i], { recursive: true }, function(err) {
								if (err) {
									console.error("Failed to remove file/directory " + files[i]);
									process.exit(1);
								}
							});
						}
					}
				}
			});
		} else {
			console.log("Action cancelled");
		}
	});
}

if (require.main === module) {
	main();
}