const core = require( '@actions/core' );
const artifact = require( '@actions/artifact' );

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

/**
 *
 * @param {imageData} imageData Representation of the png
 * @return {number} Number between 0 - 100 representing the percentage of opaque pixels within the transparent png
 */
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

/**
 *
 * @param {number} changePercent
 */
export const meetsChangeThreshold = ( changePercent ) => {
	return changePercent > 1;
};

export const getFocusableElements = async () => {
	const elements = await page.$$(
		'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
	);

	const final = [];

	for ( let i = 0; i < elements.length; i++ ) {
		// Check if it disabled
		const disabled = await (
			await elements[ i ].getProperty( 'disabled' )
		 ).jsonValue();

		// If this is null, it's not visible
		const boundingBox = await elements[ i ].boundingBox();

		const innerText = await (
			await elements[ i ].getProperty( 'innerText' )
		 ).jsonValue();

		if ( ! disabled && boundingBox !== null ) {
			final.push( elements[ i ] );
		}
	}

	return final;
};

export const createArtifact = async () => {
	const artifactClient = artifact.create();

	const artifactName = 'my-artifact';
	const files = [ '*' ];

	const rootDirectory = '../../debug'; 
	const options = {
		continueOnError: false,
	};

	await artifactClient.uploadArtifact(
		artifactName,
		files,
		rootDirectory,
		options
	);
};
