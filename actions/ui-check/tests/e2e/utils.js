const core = require( '@actions/core' );

export const cleanErrorMessage = ( msg ) => {
	return msg.replace( 'expect(received).toPassAxeTests(expected)', '' );
};

export const getDefaultUrl = ( path, query ) => {
	let defaultUrl = path;

	if ( query.length > 1 ) {
		defaultUrl += `?${ query }`;
	}

	return `(${ defaultUrl })`;
};

export const printMessage = ( command, lines) => {

    // Github actions should automatically set CI
    if( ! process.env.CI ) {
        console.log( lines.join( '\n\n' ) );
        return;
    }

    core[ command ]( lines.join( '\n\n' ) );
}