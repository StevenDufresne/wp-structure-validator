const artifact = require( '@actions/artifact' );
const artifactClient = artifact.create();
const path = 'debug';

const uploadArtifact = async () => {
    try {
    	const artifactName = 'my-artifact';
    	const files = [  ];

    	const options = {
    		continueOnError: false,
    	};

    	await artifactClient.uploadArtifact( artifactName, files, path, options );
    } catch ( e ) {
    	console.log( 'Exception creating artifact' );
    	console.log( e );
    }
}

const init = async () => {
    await uploadArtifact();
}


init();