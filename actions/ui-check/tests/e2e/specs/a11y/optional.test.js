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
	getTabbableElements,
} from '../../utils';

describe( 'Accessibility: Best Practices', () => {
	it( 'Should have logical tabbing', async () => {
		await page.goto( createURL( '/' ) );

		const tabElements = await getTabbableElements();

		let mismatch = {};

		for ( let i = 0; i < tabElements.length; i++ ) {
			await page.keyboard.press( 'Tab' );

			const tagName = await page.evaluate( () =>
				document.activeElement.tagName.toLowerCase()
			);

			// Skip these elements
			if ( [ 'audio', 'video', 'iframe' ].includes( tagName ) ) {
				i--;
				continue;
			}

			const focusMatches = await page.evaluate(
				( el ) => el === document.activeElement,
				tabElements[ i ]
			);

			// // If the innerText don't match, we assume the tabbing order is not proper
			if ( ! focusMatches ) {
				const expectedElement = await (
					await tabElements[ i ].getProperty( 'innerText' )
				 ).jsonValue();

				const currentFocus = await page.evaluate(
					() => document.activeElement.innerText
				);

				mismatch[ 'currentFocus' ] = currentFocus;
				mismatch[ 'expectedElement' ] = expectedElement;
				break;
			}

			// If we don't wait at least 100ms, the test can get out of sync
			await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );
		}

		try {
			expect( Object.keys( mismatch ).length > 0 ).toBeFalsy();
		} catch ( ex ) {
			printMessage( 'warning', [
				'[ Accessibility - Tabbing Test ]:',
				'Running test on "/".',
				`Expected to be focused on with innerText of \`${ mismatch[ 'expectedElement' ] }\`  but focused on element with innerText of \`${ mismatch[ 'currentFocus' ] }\``,
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
