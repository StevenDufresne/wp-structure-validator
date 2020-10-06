/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );

/**
 * Internal dependencies
 */
import urls from './pages';

describe( 'Accessibility', () => {
	beforeAll( async () => {
		await page.goto( createURL( '/' ) );
	} );

core.info(`
Running accessibility tests using:

https://raw.githubusercontent.com/wpaccessibility/a11y-theme-unit-test/master/a11y-theme-unit-test-data.xml
`)

	test.each( urls )(
		'Should pass Axe tests on %s',
		async ( name, path, query ) => {
			await page.goto( createURL( path, query ) );

			try {
				await expect( page ).toPassAxeTests( {
					options: {
						runOnly: {
							type: 'tag',
							values: [ 'wcag2a' ],
						},
						exclude: [ [ '.entry-content' ] ],
					},
				} );
			} catch ( e ) {
				core.setFailed( `[ Accessibility: Required Tests ]: \n\nRunning tests on ${ name }(${ path }?${ query }) \n\n${ e.message }` );
			}
		}
	);

	// OPTIONAL: Alert user about other important tests
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
				core.warning( `[ Accessibility: Optional Tests ]: \n\nRunning tests on ${ name }(${ path }?${ query }) \n\n${ e.message }` );
			}
		}
	);
} );
