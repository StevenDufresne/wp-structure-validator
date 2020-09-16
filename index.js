const exec = require('@actions/exec');

const start = async () => {
	await exec.exec('ls');
};

start();
