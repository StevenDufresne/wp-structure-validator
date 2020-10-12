const core = require( '@actions/core' );

/**
 * Removes some noise that exists in the testing framework error messages.
 *
 * @param {string} msg Error message thrown by testing framework.
 * @returns string
 */
export const cleanErrorMessage = ( msg ) => {
	return msg.replace( 'expect(received).toPassAxeTests(expected)', '' );
};

/**
 * Returns a formatted version of the url.
 *
 * @param {string} path Url of the page.
 * @param {string} query The query string of the url.
 * @returns string
 */
export const getDefaultUrl = ( path, query ) => {
	let defaultUrl = path;

	if ( query.length > 1 ) {
		defaultUrl += `?${ query }`;
	}

	return `(${ defaultUrl })`;
};

/**
 * Prints a message
 *
 * @param {command} command The name of the command that matches the `core` library messaging commands.
 * @param {array} lines The content to print.
 */
export const printMessage = ( command, lines ) => {
	// Github actions should automatically set CI
	if ( ! process.env.CI ) {
		console.log( lines.join( '\n\n' ) );
		return;
	}

	core[ command ]( lines.join( '\n\n' ) );
};

export const percentOpaque = ( imageData ) => {
	let i;
	let opaquePixels = 0;

	for ( i = 3; i < imageData.length; i += 4 ) {
		if ( imageData[ i ] === 255 ) {
			opaquePixels++;
        }
    }

    const totalPixels = imageData.length / 4;
	return ( opaquePixels / totalPixels ) * 100;
};

export const meetsChangeThreshold = ( changePercent ) => {
    return changePercent > 1;
}
