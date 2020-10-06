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

	test.each( urls )(
		'Should pass Axe tests on %s',
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
			} catch (e) {
				core.setFailed( `[ Accessibility Tests ]: \n\n${ e }` );
			}
		}
	);
} );