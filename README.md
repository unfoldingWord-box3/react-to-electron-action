# React Web App to Electron action

**The process to create a Github Action is documented [here](https://help.github.com/en/actions/building-actions/creating-a-javascript-action).**

## Overview

This action takes a React Web application and, using the following tools, will convert it into an Electron application.

The Tooling required for this:
- [Ionic's Capacitor](https://capacitor.ionicframework.com/)
- [Electron Builder](https://www.electron.build/)

There are but few constraints in the application - see details below. Once those constraints are met, there are no requirementes to make any changes to the application. And there are no artifacts that will be checked back in to the repository. The action will produce installers for whatever OS types are specified in the workflow. These will be attached to the tag or release.

## Assumptions and Prerequisites

1. In case it isn't obvious, this action only works for React applications.

1. The action uses `yarn` internally, but this should not impact the source application since nothing is retained except the installers attached to the release tag.

1. This action requires that a tag in semver format be associated to the workflow. An error is thrown if no semver tag is present.

1. Due to this [issue](https://github.com/ionic-team/capacitor/issues/2604) it is required that the application provide a replacement `package.json` to use for the Electron application. **NOTE! this is not the `package.json` that is used by the application itself.** An example is provided in Appendix A. At present, this must be located at `./public/electron-package.json`. Modify the example and add to your repository.

1. There must be a `build` script in the application `package.json` that will create a build folder with all resolved, compiled code. At present, that entry must be exactly: `"electron:build": "react-scripts build"`. An example `scripts` section from a `package.json` is provided in Appendix B.

1. Electron Builder requires image that is *at least* 256x256 for the splash screen. If your application is initialized in the normal React way, then there will be an `android-chrome-512x512.png` image in `./public`. It can be used if needed.

1. This action **must** be preceded by the following actions:
- a check out action.
- a setup node action.
- tbd

## Inputs

### `appname`

**Required** The name of application. Same as in `package.json`.

### `appid`

**Required** The id of the application in reverse URI domain style.

### `path`

This is the path portion of the "homepage" field in the application's `package.json`. 

- For example, if this is set to `https://example.com`, then the value should be empty: `""`. 
- Or, if the field is set to `https://example.com/my-app/`, then the value should be: `"my-app"`. 

Other details are explained in this [issue](https://github.com/facebook/create-react-app/issues/2575), 

*NOTE: At present using an override in `.env` is not supported.*

This value is used to correct the `index.html` location of assets. In particular, all of them must be relative to Electron's folder. This impacts three kinds of links in `index.html`:
1. `favicon.ico`: must be set to `./favicon.ico`.
2. `manifest.json`: must be set to `./manifest.json`.
3. Other static assets must similarly be corrected to located in `./`.

*Note: if this is not set correctly, the Electron app will display a blank screen and will show file access errors in the console.*

## Outputs


## Example usage

```
steps:
- name: Convert to Electron
    id: convert-to-electron
    uses: unfoldingWord-box3/react-to-electron-action@v1
    with:
        appname: My-App
        appid: org.my-app
        path: ''
```


# Appendix A - Example Electon `package.json`

The following example must be modified per your application and checked into your application. It must be located in `./public`:

```
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "My Application",
  "main": "index.js",
  "homepage": "https://my-app.org/",
  "scripts": {
    "electron:start": "electron ./",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  },
  "build": {
    "appId": "org.app.my",
    "linux": {
      "target": "deb",
      "icon": "app/my-app.png",
      "maintainer": "my-app.org"
    },
    "win": {
      "target": "nsis",
      "icon": "app/my-app.png"
    },
    "mac": {
      "category": "public.app-category.utilities",
      "target": "default",
      "icon": "app/my-app.png"
    }
  },
  "dependencies": {
    "@capacitor/electron": "^1.5.1",
    "electron-is-dev": "^1.1.0"
  },
  "devDependencies": {
    "electron": "^8.1.1",
    "electron-builder": "^22.4.1"
  },
  "keywords": [
    "capacitor",
    "electron"
  ],
  "author": {
    "name": "my-app.org",
    "email": "dev@my-app.org"
  },
  "license": "MIT"
}
```

# Appendix B - Example `package.json` snippet

This is the scripts section from an application that has added the required `electron:build` entry:

```
"scripts": {
    "styleguide": "styleguidist server",
    "styleguide:build": "styleguidist build && mv styleguide build",
    "start": "rescripts start",
    "build": "rescripts build && yarn styleguide:build",
    "electron:build": "react-scripts build",
    "deploy": "git push",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "test:cov": "yarn cypress:run && nyc report --reporter=json-summary --reporter=text-summary",
    "test:unit": "jest __tests__ && cat ./coverage/lcov.info | coveralls",
    "test": "start-test 3000 test:cov",
    "create-coverage-badge": "bash scripts/create-badge-json.sh"
},
```

# Appendix Z - Scripted Basis

This action was developed after the following script was developed and working well. The version below was a second iteration for a second project.

`build-electron.sh`
```
#!/bin/sh

CLONETARGET="build-electron"
REPOGIT=git@github.com:unfoldingword/tc-create-app.git

if [ "$1x" != "x" ] 
then
	CLONETARGET=$1
else 
	echo Usage: sh ${CLONETARGET}.sh targetdir
	echo where targetdir is git clone folder to create
	echo For example, sh ${CLONETARGET}.sh myapp
	exit
fi

if [ -d "$CLONETARGET" ]; then
	echo +-------------------------------------------------------------+
	echo The clone target  $CLONETARGET already exits 
	echo Fatal Error!                                 
	echo +-------------------------------------------------------------+
	exit
fi

echo +-------------------------------------------------------------+
echo The clone target is $CLONETARGET 
echo Clone the repo
echo Start at `date`
echo +-------------------------------------------------------------+

git clone $REPOGIT $CLONETARGET

echo +-------------------------------------------------------------+
echo Switch to cloned folder

cd $CLONETARGET 

ROOT=`pwd`
echo Root folder of project is $ROOT

echo +++++++++++++++++++++++++++++++++++++++++ Begin Scope of Action
echo Get dependencies with yarn
echo +-------------------------------------------------------------+

yarn install

echo +-------------------------------------------------------------+
echo Build the react web app with yarn build
echo +-------------------------------------------------------------+

yarn electron:build

echo +-------------------------------------------------------------+
echo Add capacitor
echo +-------------------------------------------------------------+

yarn add --dev @capacitor/core @capacitor/cli

echo +-------------------------------------------------------------+
echo Initialize capacitor
echo +-------------------------------------------------------------+
APPNAME="tc-create-app"
APPID="org.unfoldingword.TcCreateApp"
npx cap init --web-dir "build" $APPNAME $APPID

echo +-------------------------------------------------------------+
echo Define target platform with capacitor
echo +-------------------------------------------------------------+

npx cap add electron

echo +-------------------------------------------------------------+
echo Fix electron package.json, from public/electron-package.json
echo a. change name
echo b. change description
echo c. supply author
echo d. replace capacitor splash png with ours

cd $ROOT
cp ./public/electron-package.json ./electron/package.json
cp ./public/glts_logo_white.png ./electron/splash_assets/splash.png

echo +-------------------------------------------------------------+
echo Fix electron index.html
echo +-------------------------------------------------------------+

cd $ROOT/electron/app 
sed \
	-e "s#/favicon#./favicon#g" \
	-e "s#/manifest#./manifest#g" \
	-e "s#/static#./static#g" \
	< index.html > x && mv x index.html
cd $ROOT 

echo +-------------------------------------------------------------+
echo Copy index.js to app folder
echo +-------------------------------------------------------------+

cd $ROOT/electron/
cp index.js app
cd $ROOT 



echo +-------------------------------------------------------------+
echo Key Concepts
echo 1. At this point, the electron app is in the electron folder.
echo 2. It is completely separated from the React web app.
echo 3. It has its own package.json file
echo 4. You can start it: yarn electron:start
echo 5. All packaging work needs to be done inside this folder!
echo +-------------------------------------------------------------+


echo +-------------------------------------------------------------+
echo Install electron and electron-builder
echo +-------------------------------------------------------------+

cd $ROOT/electron
yarn add --dev electron
yarn add --dev electron-builder 

echo +-------------------------------------------------------------+
echo Run packager 
echo +-------------------------------------------------------------+

$ROOT/electron/node_modules/.bin/electron-builder
echo +++++++++++++++++++++++++++++++++++++++++ End Scope of Action

echo +-------------------------------------------------------------+
echo Done at `date`
echo +-------------------------------------------------------------+
```