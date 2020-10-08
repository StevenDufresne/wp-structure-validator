/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );
const fs = require( 'fs' );
const PNG = require( 'pngjs' ).PNG;
const pixelmatch = require( 'pixelmatch' );

/**
 * Internal dependencies
 */
import { printMessage } from '../../utils';

describe( 'Accessibility: Required', () => {
	// it( 'Must contain skip links', async () => {
	// 	await page.goto( createURL( '/' ) );
	// 	await page.keyboard.press( 'Tab' );

	// 	const activeElement = await page.evaluate( () => {
	// 		const el = document.activeElement;

	// 		return {
	// 			tag: el.tagName,
	// 			text: el.innerText,
	// 			hash: el.hash,
	// 			isVisible: el.offsetHeight > 0 && el.offsetWidth > 0,
	// 		};
	// 	} );

	// 	try {
	// 		// Expect it to be a link
	//         expect( activeElement.tag.toLowerCase() ).toEqual( 'a' );
	//         expect(
	// 			activeElement.hash.toLowerCase().indexOf( '#' ) >= 0
	// 		).toBeTruthy();
	// 	} catch ( e ) {
	// 		printMessage( 'setFailed', [
	// 			'[ Accessibility - Required Tests ]:',
	// 			'Running tests on Home (/)',
	//             'Unable to find a legitimate skip link.',
	//             'See https://make.wordpress.org/accessibility/handbook/markup/skip-links for more information.'
	// 		] );
	// 		throw Error();
	// 	}

	// 	try {
	// 		// Expect the anchor tag to have a matching element
	//         const el = await page.$( activeElement.hash );

	//         expect( el ).not.toBeNull()
	// 	} catch ( e ) {
	// 		printMessage( 'setFailed', [
	// 			'[ Accessibility - Required Tests ]:',
	// 			'Running tests on Home (/)',
	// 			"The skip link doesn't have a matching element on the page.",
	// 			`Expecting to find an element with an id matching: "${ activeElement.hash.replace('#', '') }".`,
	// 		] );
	// 		throw Error();
	//     }

	// 	try {
	// 		// Expect it to have the right copy
	// 		expect(
	// 			activeElement.text.toLowerCase().indexOf( 'skip' ) >= 0
	// 		).toBeTruthy();
	// 	} catch ( e ) {
	// 		printMessage( 'warning', [
	// 			'[ Accessibility - Required Tests ]:',
	// 			'Running tests on Home (/)',
	// 			'Skip link should contain the word "Skip".',
	// 		] );
	// 	}
	// } );

	it( 'Must keyboard well :)', async () => {
		await page.goto( createURL( '/' ) );

		const hasAcceptableFocusState = async ( element, idx ) => {

			// Grab the element dimension
			const dimensions = await element.boundingBox();

			// Pad the element to catch outlines
			const padding = 5;
			const clip = {
				x: dimensions.x - padding,
				y: dimensions.y - padding,
				width: dimensions.width + padding * 2,
				height: dimensions.height + padding * 2,
			};

			// Take a screenshot before focus
			const beforeSnap = await element.screenshot( { type: 'png', clip } );

			// Set focus to the elements
			await element.focus();

			// Take a screenshot after focus
			const afterSnap = await element.screenshot( { type: 'png', clip } );

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

			// Save it so we can spot check during development
			fs.writeFileSync( `debug/debug-diff-${idx}.png`, PNG.sync.write( diff ) );

			// Check to see if the image data has an opaque pixel, meaning the threshold was met
			return diff.data.includes( 255 );
		};

        // TO DO: Filter out disabled elements
		const els = await page.$$(
			'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
		);

		for ( let i = 0; i < els.length; i++ ) {
            const result = await hasAcceptableFocusState( els[ i ], i );
            
            if(! result ) {
                throw Error(`Found a problem with: Element #${i}.`)
            }
        }
        
        expect( true ).toBeTruthy();
	} );
} );