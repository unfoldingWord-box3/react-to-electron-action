const core = require('@actions/core');
const github = require('@actions/github');

try {
  // `who-to-greet` input defined in action metadata file
  const appName = core.getInput('appname');
  console.log(`App name is ${appName}!`);
  const appId = core.getInput('appid');
  console.log(`App id is ${appId}!`);
  const path = core.getInput('path');
  console.log(`Path is ${path}!`);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
  core.setOutput("appname", appName);
  core.setOutput("appid", appId);
  core.setOutput("path", path);
  } catch (error) {
  core.setFailed(error.message);
}

/*
const time = (new Date()).toTimeString();
core.setOutput("time", time);
*/