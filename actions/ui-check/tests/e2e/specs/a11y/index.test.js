/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );

/**
 * Internal dependencies
 */
import { printMessage } from '../../utils';

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
				'Running tests on Home (/)',
                'Unable to find a legitimate skip link.',
                'See https://make.wordpress.org/accessibility/handbook/markup/skip-links for more information.'
			] );
			throw Error();
		}

		try {
			// Expect the anchor tag to have a matching element
            const el = await page.$( activeElement.hash );

            expect( el ).not.toBeNull()
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on Home (/)',
				"The skip link doesn't have a matching element on the page.",
				`Expecting to find an element with an id matching: "${ activeElement.hash.replace('#', '') }".`,
			] );
			throw Error();
        }
        
		try {
			// Expect it to have the right copy
			expect(
				activeElement.text.toLowerCase().indexOf( 'skip' ) >= 0
			).toBeTruthy();
		} catch ( e ) {
			printMessage( 'warning', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on Home (/)',
				'Skip link should contain the word "Skip".',
			] );
		}
	} );
} );
