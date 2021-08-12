#!/usr/bin/env python3

#This script (re)creates the development environment after it is cleaned. It adds Apache Cordova's
#plugins and platforms (Apache licensed code). That's why these aren't included with the MIT
#licensed application source code and they need to be added separately.

#Don't generate pycache directory. This can be removed.
from sys import dont_write_bytecode
dont_write_bytecode = True

from core import run_w_err_handling, cd_project_root

def main():
	cd_project_root()
	run_w_err_handling(["cordova", "platform", "add", "browser"], \
		"An Apache Cordova error ocurred. Stopping . . .")
	run_w_err_handling(["cordova", "plugin", "add", "cordova-plugin-file"], \
		"An Apache Cordova error ocurred. Stopping . . .")

if __name__ == "__main__":
	main()