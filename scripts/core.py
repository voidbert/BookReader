#A script with functions needed for other scripts

#Calls subprocess.run with args (a list of strings that should include the command name and the
#arguments) and prints error_msg if the process's return code is anything other than 0. The boolean
#should_exit will make the function call exit() with return code 1.
def run_w_err_handling(args, error_msg, should_exit = True):
	from subprocess import run

	rc = run(args)
	if rc.returncode != 0:
		print(str(error_msg) + " (return code: {0})".format(str(rc.returncode)))
		if should_exit:
			exit(1)

#Sets the present working directory to the root of the project. For this to work, the script must be
#in the scripts directory.
def cd_project_root():
	from os import chdir
	from os.path import join, dirname

	project_root = join(dirname(__file__), "..")
	chdir(project_root)