const core = require( '@actions/core' );

/**
 * Removes some noise that exists in the testing framework error messages.
 * @param {string} msg Error message thrown by testing framework.
 * @returns {string}
 */
export const cleanErrorMessage = ( msg ) => {
	return msg
		.replace( 'expect(received).toPassAxeTests(expected)', '' )
        .replace( 'Expected page to pass Axe accessibility tests.', '' )
};

/**
 * Returns a formatted version of the url.
 * @param {string} path Url of the page.
 * @param {string} query The query string of the url.
 * @returns {string}
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
 * Returns the percentage of pixels that are opaque in a png with transparency
 * @param {imageData} imageData Representation of the png
 * @return {number} Number between 0 - 100 representing the percentage of opaque pixels within the transparent png
 */
export const getPercentOfOpaqueness = ( imageData ) => {
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

/**
 * Retrieves list elements that are focusable by keyboard from the DOM excluding hidden & disabled elements.
 * @return {array} List of focusable element
 */
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

		if ( ! disabled && boundingBox !== null ) {
			final.push( elements[ i ] );
		}
	}

	return final;
};

/**
 * Returns a portion of html if outerHtml is too large
 *
 * @param {string} outerHtml
 * @returns {string}
 */
export const truncateElementHTML = ( outerHtml ) => {
	if ( outerHtml.length > 100 ) {
		return outerHtml.substring( 0, outerHtml.indexOf( '>' ) + 1 );
	}

	return outerHtml;
};
