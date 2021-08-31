//A script with functions needed for other scripts

//Runs a command synchronously with argv as its arguments.
exports.runCommand = function(command, argv) {
	const { spawnSync } = require("child_process");
	return spawnSync(command, argv).status;
}

//Sets the present working directory to the root of the project. For this to work, the script must
//be in the scripts directory.
exports.cdProjectRoot = function() {
	const { join } = require("path");
	process.cwd(join(__dirname, ".."));
};

//Asks the user a question and, after they answer, callback is called with the answer as the first
//argument.
exports.prompt = function(string, callback) {
	const readline = require("readline").createInterface({
		input:  process.stdin,
		output: process.stdout
	});
	readline.question(string, function(answer) {
		callback(answer);
		readline.close();
	});
}