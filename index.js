const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require("child_process");

//
// Logger
//
const logger = msg => console.log(`\n${msg}`); 

//
// Exits with error code and message
//
const exit = msg => {
	console.error(msg);
	process.exit(1);
};

//
// Executes the provided shell command and redirects stdout/stderr to the console
// docs: https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options
// The execSync will throw an error on timeout or non-zero exit code.
const exec = (cmd, cwd) => 
    execSync(cmd, { 
        encoding: "utf8", 
        stdio: "inherit", 
        shell: "/bin/sh",
        cwd 
});

try {
    // get the inputs defined in action metadata file
    const appName = core.getInput('appname');
    logger(`App name is ${appName}!`);
    const appId = core.getInput('appid');
    logger(`App id is ${appId}!`);
    const path = core.getInput('path');
    logger(`Path is ${path}!`);

    // are any missing (all are required)
    const requiredMessage = " is required!";
    if ( appName === undefined || appName === null ) {
        throw ("appName" + requiredMessage)
    }

    if ( appId === undefined || appName === null ) {
        throw ("appId" + requiredMessage)
    }

    if ( path === undefined || appName === null ) {
        throw ("path" + requiredMessage)
    }
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    logger(`The event payload: ${payload}`);
    
    // set env variables for use later on
    core.setOutput("appname", appName);
    core.setOutput("appid", appId);
    core.setOutput("path", path);

    //
    // Step 1 - Install dependencies
    //
    const yarnInstall = 'yarn install';
    exec(yarnInstall);
    
} catch (error) {
    core.setFailed(error.message);
}

/*
const time = (new Date()).toTimeString();

See code at below for how to run commands, etc.
https://github.com/samuelmeuli/action-electron-builder/blob/master/index.js

*/