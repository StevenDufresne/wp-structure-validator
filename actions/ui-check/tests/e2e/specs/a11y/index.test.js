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
		let activeElement;
		await page.goto( createURL( '/' ) );
		await page.keyboard.press( 'Tab' );

		try {
			activeElement = await page.evaluate( () => {
				const el = document.activeElement;

				return {
					tag: el.tagName,
					text: el.innerText,
					href: el.href,
					isVisible: el.offsetHeight > 0 && el.offsetWidth > 0,
				};
			} );
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on Home (/)',
				"Couldn't find skip links.",
			] );
			throw Error();
		}

		try {
			// Expect it to be a link
			expect( activeElement.tag.toLowerCase() ).toEqual( 'a' );
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on Home (/)',
				"First tab doesn't select a link.",
			] );
			throw Error();
		}

		try {
			// Expect it to have an anchor tag
			expect(
				activeElement.href.toLowerCase().indexOf( '#' ) >= 0
			).toBeTruthy();
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on Home (/)',
				'Skip link doesn\'t include an "#" symbol pointing at an element on the page.',
			] );
			throw Error();
		}

		try {
			// Expect the anchor tag to have a matching element
			await page.$( el.href, ti );
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on Home (/)',
				"The skip link doesn't have a matching element on the page.",
				`Expecting to find "${ el.href }.`,
			] );
			throw Error();
		}

		try {
			// Expect it to be visible
			expect( activeElement.isVisible ).toBeTruthy();
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on Home (/)',
				'Skip link is not visible.',
			] );
			throw Error();
		}

		try {
			// Expect it to have the right copy
			expect(
				activeElement.text.toLowerCase().indexOf( 'skip' ) >= 0
			).toBeTruthy();
		} catch ( e ) {
			printMessage( 'setFailed', [
				'[ Accessibility - Required Tests ]:',
				'Running tests on Home (/)',
				'Skip link doesn\'t contain the word "Skip".',
			] );
			throw Error();
		}
	} );
} );
