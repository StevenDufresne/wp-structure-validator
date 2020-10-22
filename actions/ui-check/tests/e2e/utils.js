const core = require( '@actions/core' );

/**
 * Removes some noise that exists in the testing framework error messages.
 * @param {string} msg Error message thrown by testing framework.
 * @returns {string}
 */
export const cleanErrorMessage = ( msg ) => {
	return msg
		.replace( 'expect(received).toPassAxeTests(expected)', '' )
		.replace( 'Expected page to pass Axe accessibility tests.', '' );
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
 * @param {string} command The name of the command that matches the `core` library messaging commands.
 * @param {string[]} lines The content to print.
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
 * @param {array} imageData Representation of the png
 * @return {number} Number between 0 - 100 representing the percentage of opaque pixels within the transparent png
 */
export const getPercentOfOpaqueness = ( imageData ) => {
	let i;
	let opaquePixels = 0;

	// Pixels are represented in groups of four. Ie: rgba(255,0,0,0)
	// We check the 4th item for transparency
	for ( i = 3; i < imageData.length; i += 4 ) {
		if ( imageData[ i ] === 255 ) {
			opaquePixels++;
		}
	}

	const totalPixels = imageData.length / 4;
	return ( opaquePixels / totalPixels ) * 100;
};

/**
 *  Returns whether the percentage of change is great enough
 * @param {number} changePercent
 */
export const meetsChangeThreshold = ( changePercent ) => {
	return changePercent > 0;
};

/**
 * Returns whether the element is visible
 * @param {Puppeteer|ElementHandle} element
 * @return {boolean} List of focusable element
 */
const elementIsVisible = async ( element ) => {
	// If the bounding box is null, it's not visible
	return ( await element.boundingBox() ) !== null;
};

/**
 * Retrieves list elements that are focusable by keyboard from the DOM
 * @return {array} List of focusable element
 */
const queryForFocusableElements = async () => {
	return await page.$$(
		'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
	);
};

/**
 * Retrieves list elements that are focusable by keyboard from the DOM excluding hidden & disabled elements.
 * @return {Puppeteer|ElementHandle[]} List of focusable element
 */
export const getFocusableElements = async () => {
	const elements = await queryForFocusableElements();
	const final = [];

	for ( let i = 0; i < elements.length; i++ ) {
		// Check if it disabled
		const disabled = await (
			await elements[ i ].getProperty( 'disabled' )
		 ).jsonValue();

		if ( ! disabled && ( await elementIsVisible( element[ i ] ) ) ) {
			final.push( elements[ i ] );
		}
	}

	return final;
};

/**
 * Retrieves list elements that are tabbing by keyboard.
 * @return {Puppeteer|ElementHandle[]} List of tabbable element
 */
export const getTabbableElements = async () => {
	const elements = await queryForFocusableElements();
	const final = [];

	for ( let i = 0; i < elements.length; i++ ) {
		const element = await page.evaluate( ( el ) => {
			/**
			 * Returns whether element is visible
			 * @param {HTMLelement} element
			 * @returns {boolean}
			 */
			const isVisible = ( element ) => {
				const rect = element.getBoundingClientRect();
				return ! (
					rect.x <= 0 ||
					rect.y - window.innerHeight >= 0 ||
					( rect.width === 0 && rect.height === 0 )
				);
			};

			/**
			 * Crawls upward looking for the outermost <ul> element
			 * @param {HTMLElement} element
			 * @returns {HTMLElement}
			 */
			const getOutermostUl = ( element ) => {
				var parent = element.parentElement.closest( 'ul' );

				if ( parent === null ) {
					return element;
				}

				return getOutermostUl( parent );
			};

			// Is it most likely a nav item?
			let parent = getOutermostUl( el );

			return {
				tagName: el.tagName,
				disabled: el.disabled,
				href: el.href,
				innerText: el.innerText,
				isLikelyNavItem: parent !== el && isVisible( parent ),
			};
		}, elements[ i ] );

		// Disabled elements will not get tabbing focus
		if ( element.disabled ) {
			continue;
		}

		// Links without hrefs will not get tabbing focus
		if ( element.tagName.toLowerCase() === 'a' && ! element.href ) {
			continue;
		}

		// Only include hidden elements if they are most likely part of navigation
		if (
			! ( await elementIsVisible( elements[ i ] ) ) &&
			! element.isLikelyNavItem
		) {
			continue;
		}

		final.push( elements[ i ] );
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
	if ( outerHtml.length > 200 ) {
		return outerHtml.substring( 0, outerHtml.indexOf( '>' ) + 1 );
	}

	return outerHtml;
};

/**
 *
 * @param {string} type @github/core message type. Ie: setFailed, warning, info
 * @param {string|string[]} message Messages to display
 * @param {function} testToRun The test that will be executed
 */
const expectWithMessage = ( type, message, testToRun ) => {
	const output = Array.isArray( message ) ? message : [ message ];

	try {
		testToRun();
	} catch ( e ) {
		printMessage( type, output );
	}
};

/**
 * Outputs messages as error
 * @param {string|string[]} message Messages to output
 * @param {function} test Function to run
 */
export const errorWithMessageOnFail = ( message, test ) => {
	return expectWithMessage( 'setFailed', message, test );
};

/**
 * Outputs messages as warning
 * @param {string|string[]} message Messages to output
 * @param {function} test Function to run
 */
export const warnWithMessageOnFail = ( message, test ) => {
	return expectWithMessage( 'warning', message, test );
};
