/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
const fs = require( 'fs' );
const PNG = require( 'pngjs' ).PNG;
const pixelmatch = require( 'pixelmatch' );

import {
	printMessage,
	meetsChangeThreshold,
	getPercentOfOpaqueness,
	getFocusableElements,
	truncateElementHTML,
} from '../../utils';

const SCREENSHOT_FOLDER_PATH = 'screenshots';

/**
 * Custom Error type to be throw in tests
 *
 * @param {array|string} messages
 */
function FailedTestException( messages ) {
	this.messages = messages;
}

/**
 * Tests whether the theme has legitimate skip links
 *
 * See https://make.wordpress.org/themes/handbook/review/required/#skip-links
 */
const testSkipLinks = async () => {
	await page.goto( createURL( '/' ) );
	await page.keyboard.press( 'Tab' );

	const activeElement = await page.evaluate( () => {
		const el = document.activeElement;

		return {
			tag: el.tagName,
			text: el.innerText,
			hash: el.hash,
			isVisible: el.offsetHeight > 0 && el.offsetWidth > 0,
		};
	} );

	try {
		expect( activeElement.tag.toLowerCase() ).toEqual( 'a' );
		expect(
			activeElement.hash.toLowerCase().indexOf( '#' ) >= 0
		).toBeTruthy();
	} catch ( e ) {
		throw new FailedTestException( [
			'[ Accessibility - Required Tests ]:',
			'Running tests on "/".',
			'Unable to find a legitimate skip link.',
			'See https://make.wordpress.org/themes/handbook/review/required/#skip-links for more information.',
		] );
	}

	try {
		// Expect the anchor tag to have a matching element
		const el = await page.$( activeElement.hash );

		expect( el ).not.toBeNull();
	} catch ( e ) {
		throw new FailedTestException( [
			'[ Accessibility - Required Tests ]:',
			'Running tests on "/".',
			"The skip link doesn't have a matching element on the page.",
			`Expecting to find an element with an id matching: "${ activeElement.hash.replace(
				'#',
				''
			) }".`,
			'See https://make.wordpress.org/themes/handbook/review/required/#skip-links for more information.',
		] );
	}
};

/**
 * Tests whether the theme has an acceptable navigation
 *
 * See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation
 */
const testSubMenus = async () => {
	await page.goto( createURL( '/' ) );

	const ErrorMessages = {
		displayNone: 'USES_DISPLAY_NONE',
		notVisible: 'MENU_NOT_VISIBLE',
	};

	/**
	 * We run these tests within the browser directly
	 */
	const error = await page.evaluate( ( ErrorMessages ) => {
		let error;
		const mainNavItems = document.querySelectorAll( 'nav ul li' );

		/**
		 * Return whether the submenu is hidding using display:none
		 * @param {HTMLElement} element Reference to a dom node
		 * @returns {boolean}
		 */
		const menuUsesDisplayNone = ( element ) => {
			return getComputedStyle( element ).display.toLowerCase() === 'none';
		};

		/**
		 * Returns whether the element is visible on screen
		 * @param {HTMLElement} element Reference to a dom node
		 * @returns {boolean}
		 */
		const elementIsVisible = ( element ) => {
			const rect = element.getBoundingClientRect();
			return ! ( rect.x < 0 || rect.y - window.innerHeight >= 0 );
		};

		for ( let i = 0; i < mainNavItems.length; i++ ) {
			const link = mainNavItems[ i ].querySelector( 'a' );
			const subMenu = mainNavItems[ i ].querySelector( 'ul' );

			if ( link && subMenu ) {
				if ( menuUsesDisplayNone( subMenu ) ) {
					error = ErrorMessages.displayNone;
					break;
				}

				// Select the link
				link.focus();

				// Is the submenu visible?
				if ( ! elementIsVisible( subMenu ) ) {
					error = ErrorMessages.notVisible;
					break;
				}
			}
		}

		return error;
	}, ErrorMessages );

	try {
		expect( error ).toBeUndefined();
	} catch ( ex ) {
		const messages = [
			'[ Accessibility - Required Tests ]:',
			'Running tests on "/".',
			"Your theme's navigation is not working as expected.",
		];

		if ( error === ErrorMessages.displayNone ) {
			messages.push(
				'Submenus should be become visible when tabbing through the main navigation.'
			);
		} else if ( error === ErrorMessages.notVisible ) {
			messages.push( 'Submenus cannot be hidden using `display: none`.' );
		}

		throw new FailedTestException( [
			...messages,
			'See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation for more information.',
		] );
	}
};

const hasAcceptableFocusState = async ( element, idx ) => {
	try {
		// Grab the element dimension
		const dimensions = await element.boundingBox();

		// It's a hidden element
		if ( ! dimensions || dimensions.x < 0 || dimensions.y < 0 ) {
			return true;
		}

		// Pad the element to catch outlines
		const padding = 2;
		const clip = {
			x: dimensions.x - padding,
			y: dimensions.y - padding,
			width: dimensions.width + padding * 2,
			height: dimensions.height + padding * 2,
		};

		// Move the browser down before we take a screenshot
		await page.evaluate( ( yPos ) => {
			window.scrollBy( 0, yPos );
		}, dimensions.y );

		// Take a screenshot before focus
		const beforeSnap = await element.screenshot( {
			type: 'png',
			clip,
		} );

		// Set focus to the element
		await element.focus();

		// We give it a few seconds in case there is an animation
		await new Promise( ( resolve ) => setTimeout( resolve, 300 ) );

		// Take a screenshot after focus
		const afterSnap = await element.screenshot( {
			type: 'png',
			clip,
		} );

		// Compare images, create diff
		const img1 = PNG.sync.read( beforeSnap );
		const img2 = PNG.sync.read( afterSnap );

		// Use the first image to determine size
		const { width, height } = img1;
		const diff = new PNG( { width, height } );

		// Create a png with the diff overlayed on a transparent background
		// The threshold controls how 'different' the new state should be. ( 0 Low/1 High )
		pixelmatch( img1.data, img2.data, diff.data, width, height, {
			threshold: 0.3,
			diffMask: true,
		} );

		// Check to see that there is an acceptable level of change from before & after element focus
		const passes = meetsChangeThreshold(
			getPercentOfOpaqueness( diff.data )
		);

        // Save the images if the element doesn't pass
		if ( ! passes ) {
			if ( ! fs.existsSync( SCREENSHOT_FOLDER_PATH ) ) {
				fs.mkdirSync( SCREENSHOT_FOLDER_PATH );
			}

			const pageSnap = await page.screenshot( {
				type: 'png',
			} );

			// Save it so we can spot check during development
			fs.writeFileSync(
				`${ SCREENSHOT_FOLDER_PATH }/page.png`,
				PNG.sync.write( PNG.sync.read( pageSnap ) )
			);

			fs.writeFileSync(
				`${ SCREENSHOT_FOLDER_PATH }/element-before.png`,
				PNG.sync.write( img1 )
			);

			fs.writeFileSync(
				`${ SCREENSHOT_FOLDER_PATH }/element-after.png`,
				PNG.sync.write( img2 )
			);

			fs.writeFileSync(
				`${ SCREENSHOT_FOLDER_PATH }/element-diff.png`,
				PNG.sync.write( diff )
			);
		}

		return passes;
	} catch ( ex ) {
		return false;
	}
};

const testElementFocusState = async () => {
	await page.goto( createURL( '/' ) );

	const focusableElements = await getFocusableElements();

	try {
		for ( let i = 0; i < focusableElements.length; i++ ) {
			const result = await hasAcceptableFocusState(
				focusableElements[ i ],
				i
			);

			if ( ! result ) {
				const domElement = await (
					await focusableElements[ i ].getProperty( 'outerHTML' )
				 ).jsonValue();

				const openingTag = truncateElementHTML( domElement );

				// Break out of the loop forcefully
				throw Error(
					`The element "${ openingTag }" does not have enough visible difference when focused.`
				);
			}
		}
	} catch ( ex ) {
		throw new FailedTestException( [
			'[ Accessibility - Required Tests ]:',
			'Running tests on "/".',
			ex.message,
			'See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation for more information.',
		] );
	}
};

describe( 'Accessibility: Required', () => {
	/**
	 * We run all the test synchronously to control how many errors get outputted to reduce noise
	 */
	it( 'Should pass the following tests:', async () => {
		try {
		//	await testSkipLinks();
		//	await testSubMenus();
			await testElementFocusState();
		} catch ( ex ) {
			if ( ex instanceof FailedTestException ) {
				printMessage( 'setFailed', ex.messages );
			} else {
				console.log( ex );
			}
		}
	} );
} );
