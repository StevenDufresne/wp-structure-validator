const exec = require('@actions/exec');

const start = async () => {
    const folder = await exec.exec('ls');
    console.log( folder );
    const resp = await exec.exec('npm run wp-env start');
    console.log( resp );
};

start();
