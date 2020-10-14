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
import {
	printMessage,
	meetsChangeThreshold,
	percentOpaque,
	getFocusableElements,
	createArtifact,
} from '../../utils';

describe( 'Accessibility: Required', () => {
	it( 'Must contain skip links', async () => {
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
			// Expect it to be a link
			expect( activeElement.tag.toLowerCase() ).toEqual( 'a' );
			expect(
				activeElement.hash.toLowerCase().indexOf( '#' ) >= 0
			).toBeTruthy();
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on "/".',
				'Unable to find a legitimate skip link.',
				'See https://make.wordpress.org/themes/handbook/review/required/#skip-links for more information.',
			] );
			throw Error();
		}

		try {
			// Expect the anchor tag to have a matching element
			const el = await page.$( activeElement.hash );

			expect( el ).not.toBeNull();
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on "/".',
				"The skip link doesn't have a matching element on the page.",
				`Expecting to find an element with an id matching: "${ activeElement.hash.replace(
					'#',
					''
				) }".`,
				'See https://make.wordpress.org/themes/handbook/review/required/#skip-links for more information.',
			] );
			throw Error();
		}
	} );

	it( 'Navigation submenus are not working properly', async () => {
		await page.goto( createURL( '/' ) );

		const error = await page.evaluate( () => {
			let error;
			const navItems = document.querySelectorAll( 'nav ul li' );

			/**
			 *
			 * @param {HTMLElement} element Reference to a dom node
			 */
			function menuUsesDisplayNone( element ) {
				return (
					getComputedStyle( element ).display.toLowerCase() === 'none'
				);
			}

			/**
			 *
			 * @param {HTMLElement} element Reference to a dom node
			 */
			function elementIsVisible( element ) {
				const rect = element.getBoundingClientRect();
				return ! ( rect.x < 0 || rect.y - window.innerHeight >= 0 );
			}

			for ( let i = 0; i < navItems.length; i++ ) {
				const link = navItems[ i ].querySelector( 'a' );
				const subMenu = navItems[ i ].querySelector( 'ul' );

				if ( link && subMenu ) {
					if ( menuUsesDisplayNone( subMenu ) ) {
						error = 'USES_DISPLAY_NONE';
						break;
					}

					// Select the link
					link.focus();

					// Is the submenu visible?
					if ( ! elementIsVisible( subMenu ) ) {
						error = 'MENU_NOT_VISIBLE';
						break;
					}
				}
			}

			return error;
		} );

		try {
			expect( error ).toBeUndefined();
		} catch ( ex ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on "/".',
				'Navigation is not following the rules.',
				'See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation for more information.',
			] );
		}
	} );

	it( 'Focusable element must have identifiable :focus state', async () => {
		await page.goto( createURL( '/' ) );

		const hasAcceptableFocusState = async ( element, idx ) => {
			try {
				// Grab the element dimension
				const dimensions = await element.boundingBox();

				// It's a hidden element
				if ( ! dimensions || dimensions.x < 0 || dimensions.y < 0 ) {
					return true;
				}

				// Pad the element to catch outlines
				const padding = 5;
				const clip = {
					x: dimensions.x - padding,
					y: dimensions.y - padding,
					width: dimensions.width + padding * 2,
					height: dimensions.height + padding * 2,
				};

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

				const path = `debug/${ idx }/`;

				// Create a temporary directory
				if ( ! fs.existsSync( path ) ) {
					fs.mkdirSync( path );
				}

				// Save it so we can spot check during development
				fs.writeFileSync(
					`${ path }before.png`,
					PNG.sync.write( img1 )
				);
				fs.writeFileSync(
					`${ path }after.png`,
					PNG.sync.write( img2 )
				);
				fs.writeFileSync( `${ path }diff.png`, PNG.sync.write( diff ) );

				// Check to see if the image data has an opaque pixel, meaning the threshold was met
				return meetsChangeThreshold( percentOpaque( diff.data ) );
			} catch ( ex ) {
				return false;
			}
		};

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

					const openingTag = domElement.substring(
						0,
						domElement.indexOf( '>' ) + 1
					);

					throw Error(
						`The element "${ openingTag }" does not have enough visible difference when focused.`
					);
				}
			}
		} catch ( ex ) {
			await createArtifact();

			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on "/".',
				ex.message,
				'See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation for more information.',
			] );
		}
	} );
} );
