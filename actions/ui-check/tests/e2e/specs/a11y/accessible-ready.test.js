/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );

/**
 * Internal dependencies
 */
import urls from './pages';
import { cleanErrorMessage, getDefaultUrl, printMessage } from '../../utils';

describe( 'Accessible: Tag Ready', () => {
    const fn = process.env.testAccessibility ? test.skip : test;
    
	fn.each( urls )(
		'Must pass Axe tests on %s',
		async ( name, path, query ) => {
			await page.goto( createURL( path, query ) );

			try {
				await expect( page ).toPassAxeTests( {
					options: {
						runOnly: {
							type: 'tag',
							values: [ 'wcag2a' ],
						},
					},
					exclude: [ [ '.entry-content' ] ],
				} );
			} catch ( e ) {
				printMessage( 'setFailed', [
					'[ Accessibility - Required Tests ]:',
					`Running tests on ${ name } ${ getDefaultUrl(
						path,
						query
					) } using: \nhttps://github.com/wpaccessibility/a11y-theme-unit-test`,
					cleanErrorMessage( e.message ),
				] );
				throw Error();
			}
		}
	);
} );
