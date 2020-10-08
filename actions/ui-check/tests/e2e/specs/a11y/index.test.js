/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );
const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

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


        const hasAcceptableFocusState = async () =>  {
            const m = await page.waitForSelector( '#skip-link' );
            
            // Grab the element dimension
            const el = await m.boundingBox();
            
            // Pad the element to catch outlines
            const padding = 5; 
            const clip = { x: el.x-padding, y: el.y-padding, width: el.width + (padding * 2), height: el.height + (padding * 2) } ;
            
            // Take a screenshot before focus
            const s1 = await m.screenshot( { type: 'png', clip });
    
            await page.keyboard.press( 'Tab' );
            
            // Take a screenshot after focus
            const s2 = await m.screenshot( { type: 'png', clip });
            
            // Compare images, create diff
            const img1 = PNG.sync.read(s1);
            const img2 = PNG.sync.read(s2);
    
            const {width, height} = img1;
            const diff = new PNG({width, height});
            
            // Create a png with the diff overlayed on a transparent background
            // The threshold controls how 'different' the new state should be. ( 0 Low/1 High )
            pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.3, diffMask: true });
    
            // Save it so we can spot check during development
            fs.writeFileSync('debug-diff.png', PNG.sync.write(diff));

            // Check to see if the image data has an opaque pixel, meaning the threshold was met
            return diff.data.includes( 255 )
        }
        
       const result =  await hasAcceptableFocusState();

       expect( result ).toBeTruthy();

        

		// const focusableElements = await page.evaluate( () => {
		// 	return [
		// 		...document.querySelectorAll(
		// 			'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
		// 		),
		// 	].filter( ( el ) => ! el.hasAttribute( 'disabled' ) );
		// } );

		// console.log( focusableElements );

		// await new Promise( ( resolve ) => setTimeout( resolve, 200000 ) );
	} );
} );
