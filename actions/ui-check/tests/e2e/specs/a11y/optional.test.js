/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';


/**
 * Internal dependencies
 */
import urls from './pages';
import { cleanErrorMessage, getDefaultUrl, printMessage } from '../../utils';


describe( 'Accessibility: Optional', () => {

	test.each( urls )(
		'Should pass optional Axe tests on %s',
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
                    '[ Accessibility - Optional Tests ]:',
                    `Running tests on ${ name }${ getDefaultUrl( path, query ) } using: \nhttps://github.com/wpaccessibility/a11y-theme-unit-test`,
                     cleanErrorMessage( e.message )
                ]);
			}
		}
	);
} );
