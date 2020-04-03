// acknowledgements
// https://github.com/samuelmeuli/action-electron-builder

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
// Determines the current operating system 
// (one of ["mac", "windows", "linux"])
//
const getPlatform = () => {
	switch (process.platform) {
		case "darwin":
			return "mac";
		case "win32":
			return "windows";
		default:
			return "linux";
	}
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

    // create artifact and asset filenames
    if ( getPlatform() === 'linux' ) {
        core.setOutput("artifactname",
            `${appname}_${version}amd64.deb`
        );
        core.setOutput("assetname",
            `${appname}_${version}amd64.deb`
        );
    } else if ( getPlatform() === 'windows' ) {
        core.setOutput("artifactname",
            `${appname} Setup ${version}.exe}`
        );
        core.setOutput("assetname",
            `${appname} Setup ${version}.exe}`
        );
    } else if ( getPlatform() === 'mac' ) {
        core.setOutput("artifactname",
            `${appname}-${version}.dmg`
        );
        core.setOutput("assetname",
            `${appname}-${version}.dmg`
        );
    } 
    
    //
    // Step 1 - Install dependencies
    const yarnInstall = 'yarn install';
    exec(yarnInstall);

    //
    // Step 2 - build the app (expect it in 'build' folder)
    const yarnElectronBuild = 'yarn electron:build';
    exec(yarnElectronBuild);

    //
    // Step 3 - add capacitor
    const yarnAddCapacitor = 'yarn add --dev @capacitor/core @capacitor/cli'
    exec(yarnAddCapacitor);

    //
    // Step 4 - initialize capacitor
    const npxCapInit = `npx cap init --web-dir build ${appname} ${appid}`;
    exec(npxCapInit);

    //
    // Step 5 npx cap add electron
    const npxCapAddElectron = 'npx cap add electron';
    exec(npxCapAddElectron);

    //
    // Step 6 copy splash png to splash assets
    const cpSplash = 'cp ./public/splash.png ./electron/splash_assets/splash.png';
    exec(cpSplash);

    //
    // Step 7 fix index html
    const sed = `cd ./electron/app && sed -e "s#/favicon#./favicon#g"`
        + `-e "s#/manifest#./manifest#g"`
        + `-e "s#/static#./static#g"`
        + `< index.html > x && mv x index.html`
    ;
    exec(sed);

    // 
    // Step 8 copy index.js to app/
    const cpindex = `cd ./electron && cp index.js app`;
    exec(cpindex);

    //
    // Step 9 install electron and electron builder
    const addEb = `cd ./electron && yarn add --dev electron electron-builder` ;
    exec(addEb);

    //
    // Step 10 run the builder
    const ebCmd = `cd ./electron && ./node_modules/.bin/electron-builder`;
    exec(ebCmd);

} catch (error) {
    core.setFailed(error.message);
}

