const exec = require('@actions/exec');
const github = require('@actions/github');

const start = async () => {
	console.log(JSON.stringify(github));
	const folder = await exec.exec('ls');
	console.log(folder);
	const resp = await exec.exec('npm run wp-env start');
	console.log(resp);
};

start();
