const exec = require('@actions/exec');

const start = async () => {
    const resp = await exec.exec('npm run wp-env start');
    console.log( resp );
};

start();
