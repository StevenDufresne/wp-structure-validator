/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
import { getPageError } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );

jest.setTimeout( 1000000 );

// TODO: either dynamically fetch a list of URLs to check (REST API or site maps?)
// or import the theme test content dataset and hard-code a list of URLs based on that.
let urls = [
	[
		'/',			// URL
		'',				// Query string starting with '?'
		'home'			// Body class to expect
	],
	[
		'/',
		'?p=1',
		'postid-1',
	],
	[
		'/',
		'?page_id=2',
		'page-id-2'
	],
	[
		'/',
		'?author=1',
		'author-1'
	],
	[
		'/',
		'?cat=1',
		'category-1'
	],
	[
		'/',
		'?feed=rss2', 	// Feeds should probably be handled by separate tests.
		''
	],
	// ...more pages

];

// Some basic tests that apply to every page
describe.each( urls )
	( 'Test URL %s%s', ( url, queryString, bodyClass ) => {

		it( 'Page should contain body class ' + bodyClass, async () => {
			await page.goto( createURL( url, queryString ) );
			const body = await page.$( 'body' );
			const bodyClassName = await(
				await body.getProperty( 'className' )
			).jsonValue();

			expect( bodyClassName.split( " " ) ).toContain( bodyClass );
		});

		it( 'Page should not have PHP errors', async () => {
			await page.goto( createURL( url, queryString ) );
			expect( await getPageError() ).toBe( null );

		});

		it( 'Page should have complete output', async() => {
			let response = await page.goto( createURL( url, queryString ) );

			expect( await response.text() ).toMatch( /<\/(html|rss)>\s*$/ );
		});

		it( 'Page should return 200 status', async() => {
			let response = await page.goto( createURL( url, queryString ) );

			//console.log( await response.text() );
			expect( await response.status() ).toBe( 200 );

		});

		it( 'Browser console should not contain errors', async() => {
			// Haven't confirmed this works
			let jsError;

			page.on( 'pageerror', ( error ) => {
				jsError = error.toString();
			} );

			await page.goto( createURL( '/' ) );

			if ( jsError ) {
				core.setFailed( `Found a JS error: \n\n${ jsError }` );
			}
		});

	}
	);

