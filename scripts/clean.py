#!/usr/bin/env python3

#This script cleans the development environment by deleting everything but the needed files and
#folders. If you need any file or directory not to be deleted, add it to the following list.
crucial_directories = [ "scripts", "www", "config.xml", "package.json", "README.md", "LICENSE", \
	".gitignore", ".git" ]

#This script also removes Cordova platforms and plugins.

#Don't generate pycache directory. This can be removed.
from sys import dont_write_bytecode as dont_write_bytecode
dont_write_bytecode = True

from os import listdir, remove
from os.path import isdir
from shutil import rmtree
from core import run_w_err_handling, cd_project_root

def main():
	if input("This action will delete files. Continue? (Y/n) ") not in [ "Y", "y" ]:
		print("Action cancelled.")
		return
	
	cd_project_root()
	listing = listdir(".")

	#Cordova cleanup
	run_w_err_handling(["cordova", "platform", "remove", "browser"], \
		"Error removing platform browser. Stopping . . .")

	run_w_err_handling(["cordova", "plugin", "remove", "cordova-plugin-file"], \
		"Error removing cordova-plugin-file. Stopping . . .")

	#File deletion
	for file in listing:
		if file not in crucial_directories:
			if isdir(file):
				rmtree(file)
			else:
				remove(file)

	print("Environment successfully cleaned!")

if __name__ == "__main__":
	main()