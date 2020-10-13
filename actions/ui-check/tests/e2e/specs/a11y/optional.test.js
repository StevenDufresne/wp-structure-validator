/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import urls from './pages';
import {
	cleanErrorMessage,
	getDefaultUrl,
	printMessage,
	getFocusableElements,
} from '../../utils';

describe( 'Accessibility: Best Practices', () => {
	it( 'Should have logical tabbing', async () => {
		await page.goto( createURL( '/' ) );
		const focusableElements = await getFocusableElements();

		let hasMismatch = false;

		for ( let i = 0; i < focusableElements.length; i++ ) {
			await page.keyboard.press( 'Tab' );

			const currentElement = await (
				await focusableElements[ i ].getProperty( 'innerText' )
			 ).jsonValue();

			const currentFocus = await page.evaluate(
				() => document.activeElement.innerText
			);

			// If the innerText don't match, we assume the tabbing order is not obvious
			if ( currentFocus !== currentElement ) {
				hasMismatch = true;
				break;
			}
		}

		try {
			expect( hasMismatch ).toBeFalsy();
		} catch ( ex ) {
			printMessage( 'warning', [
				'[ Accessibility - Best Practice Tests ]:',
				'Running test on "/".',
				'Tabbing is not working as expected.',
				'See https://make.wordpress.org/themes/handbook/review/required/#keyboard-navigation for more information.',
			] );
		}
	} );

	test.skip.each( urls )(
		'Should pass Best Practice Axe tests on %s',
		async ( name, path, query ) => {
			await page.goto( createURL( path, query ) );

			try {
				await expect( page ).toPassAxeTests( {
					options: {
						runOnly: {
							type: 'tag',
							values: [ 'best-practice' ],
						},
						exclude: [ [ '.entry-content' ] ],
					},
				} );
			} catch ( e ) {
				printMessage( 'warning', [
					'[ Accessibility - Best Practice Tests ]:',
					`Running tests on ${ name } ${ getDefaultUrl(
						path,
						query
					) } using: \nhttps://github.com/wpaccessibility/a11y-theme-unit-test`,
					cleanErrorMessage( e.message ),
				] );
			}
		}
	);
} );
