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
	elementIsVisible,
	getElementComputedStyle,
} from '../../utils';

const SCREENSHOT_FOLDER_PATH = 'screenshots';

/**
 * Custom Error type to be throw in tests
 *
 * @param {string[]} messages
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
			'[ Accessibility - Skip Link Test ]:',
			'Running tests on "/".',
			'Unable to find a legitimate skip link. Make sure your theme includes skip links where necessary.',
			'You can read more about our expectations at https://make.wordpress.org/themes/handbook/review/required/#skip-links .',
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
 * Checks the <li> for a <ul> and runs tests on it
 * @param {Puppeteer|ElementHandle} listItem
 */
const testLiSubMenu = async ( listItem ) => {
	const getFailureMessage = ( message ) => [
		'[ Accessibility - Submenu Test ]:',
		'Running tests on "/".',
		"Your theme's navigation is not working as expected.",
		message,
		'See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation for more information.',
	];

	const link = await listItem.$( 'a' );
	const submenu = await listItem.$( 'ul' );

	if ( link !== null && submenu !== null ) {
		var usesDisplayNone = await page.evaluate(
			( e ) => getComputedStyle( e ).display.toLowerCase() === 'none',
			submenu
		);

		if ( usesDisplayNone ) {
			throw new FailedTestException(
				getFailureMessage(
					'Submenus cannot be hidden using `display: none`.'
				)
			);
		}

		await link.focus();

		if ( ! ( await elementIsVisible( submenu ) ) ) {
			throw new FailedTestException(
				getFailureMessage(
					'Submenus should be become visible when tabbing through the main navigation.'
				)
			);
		}
	}
};

/**
 * Tests whether the theme has an acceptable navigation
 *
 * See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation
 */
const testSubMenus = async () => {
	await page.goto( createURL( '/' ) );

	// Get the all the lists, looking for navigations
	const ulElements = await page.$$( 'ul' );
	for ( let i = 0; i < ulElements.length; i++ ) {
		// We are only interested in sub navs
		const hasSubNavs = ( await ulElements[ i ].$( 'ul' ) ) !== null;

		// We don't have any sub menus, try another ul
		if ( ! hasSubNavs ) {
			continue;
		}

		const listItems = await ulElements[ i ].$$( 'li' );

		for ( let j = 0; j < listItems.length; j++ ) {
			await testLiSubMenu( listItems[ j ] );
		}
	}
};

/**
 * Determines whether the element has an acceptable focus state
 * @param {Puppeteer|ElementHandle} element
 * @returns {boolean}
 */
const hasAcceptableFocusState = async ( element ) => {
	// Grab the element dimension
	const dimensions = await element.boundingBox();

	// It's a hidden element
	if ( dimensions === null || dimensions.x < 0 || dimensions.y < 0 ) {
		return true;
	}

	// Move the browser down before we take a screenshot
	await page.evaluate( ( yPos ) => {
		window.scrollBy( 0, yPos );
	}, dimensions.y );

	// Take a screenshot before focus
	const beforeSnap = await page.screenshot();

	// Set focus to the element
	await element.focus();

	// We give it a few ms in case there is an animation
	await new Promise( ( resolve ) => setTimeout( resolve, 300 ) );

	// Take a screenshot after focus
	const afterSnap = await page.screenshot();

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
	const passes = meetsChangeThreshold( getPercentOfOpaqueness( diff.data ) );

	// Save the images if the element doesn't pass
	if ( ! passes ) {
		if ( ! fs.existsSync( SCREENSHOT_FOLDER_PATH ) ) {
			fs.mkdirSync( SCREENSHOT_FOLDER_PATH );
		}

		fs.writeFileSync(
			`${ SCREENSHOT_FOLDER_PATH }/before.png`,
			PNG.sync.write( img1 )
		);

		fs.writeFileSync(
			`${ SCREENSHOT_FOLDER_PATH }/after.png`,
			PNG.sync.write( img2 )
		);

		fs.writeFileSync(
			`${ SCREENSHOT_FOLDER_PATH }/diff.png`,
			PNG.sync.write( diff )
		);
	}

	return passes;
};

/**
 * Loops through focusable elements and compares if focus state to its default state.
 */
const testElementFocusState = async () => {
	await page.goto( createURL( '/' ) );

	const elements = await getFocusableElements();

	for ( let i = 0; i < elements.length; i++ ) {
		const result = await hasAcceptableFocusState( elements[ i ] );

		if ( ! result ) {
			const domElement = await (
				await elements[ i ].getProperty( 'outerHTML' )
			 ).jsonValue();

			// Break out of the loop forcefully

			throw new FailedTestException( [
				'[ Accessibility - Element Focus Test ]:',
				'Running tests on "/".',
				`The element "${ truncateElementHTML(
					domElement
				) }" does not have enough visible difference when focused. `,
				'Download the screenshots to see the offending element.',
				'See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation for more information.',
			] );
		}
	}
};

describe( 'Accessibility: Required', () => {
	/**
	 * We run all the test synchronously to control how many errors get outputted to reduce noise
	 */
	it( 'Should pass the following tests:', async () => {
		try {
			//await testSkipLinks();
			await testSubMenus();
			//await testElementFocusState();
		} catch ( ex ) {
			if ( ex instanceof FailedTestException ) {
				printMessage( 'warning', ex.messages );
			} else {
				console.log( ex );
			}
		}
	} );
} );
