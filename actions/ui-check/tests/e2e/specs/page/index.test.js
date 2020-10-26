/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
import { getPageError } from '@wordpress/e2e-test-utils';
const fetch = require('node-fetch');

/**
 * Internal dependencies
 */
import {
	getDefaultUrl,
	errorWithMessageOnFail,
	getElementPropertyAsync,
} from '../../utils';

// TODO: either dynamically fetch a list of URLs to check (REST API or site maps?)
// or import the theme test content dataset and hard-code a list of URLs based on that.
let urls = [
	[
		'/', // URL
		'', // Query string starting with '?'
		'home', // Body class to expect
	],
	[ '/', '?p=1', 'postid-1' ],
	[ '/', '?page_id=2', 'page-id-2' ],
	[ '/', '?author=1', 'author-1' ],
	[ '/', '?cat=1', 'category-1' ],
	[ '/', '?feed=rss2', '' ], // Feeds should probably be handled by separate tests.
	// ...more pages
];

var site_info;
// I've done this crudely, there's doubtless a Right Way.
fetch( createURL( '/', '?rest_route=/theme-test-helper/v1/info' ) ).then(function (response) {
	// The API call was successful!
	return response.json();
}).then(function (data) {
	site_info = data;
});

// Some basic tests that apply to every page
describe.each( urls )( 'Test URL %s%s', ( url, queryString, bodyClass ) => {
	it( 'Page should contain body class ' + bodyClass, async () => {
		// Make sure the page content appears to be appropriate for the URL.
		await page.goto( createURL( url, queryString ) );
		const body = await page.$( 'body' );
		const bodyClassName = await getElementPropertyAsync(
			body,
			'className'
		);

		errorWithMessageOnFail(
			`${ url } does not contain a body class`,
			() => {
				expect( bodyClassName.split( ' ' ) ).toContain( bodyClass );
			}
		);
	} );

	it( 'Page should not have PHP errors', async () => {
		await page.goto( createURL( url, queryString ) );
		const pageError = await getPageError();

		errorWithMessageOnFail(
			`Page contains PHP errors: ${ JSON.stringify( pageError ) }`,
			() => {
				expect( pageError ).toBe( null );
			}
		);
	} );

	it( 'Page should have complete output', async () => {
		// This should catch anything that kills output before the end of the page, or outputs trailing garbage.
		let response = await page.goto( createURL( url, queryString ) );
		const responseText = await response.text();

		errorWithMessageOnFail(
			`Page contains incomplete output: ${ JSON.stringify(
				responseText
			) }`,
			() => {
				expect( responseText ).toMatch( /<\/(html|rss)>\s*$/ );
			}
		);
	} );

	it( 'Page should return 200 status', async () => {
		let response = await page.goto( createURL( url, queryString ) );
		const status = await response.status();

		errorWithMessageOnFail(
			`Expected to received a 200 status for ${ url }. Received ${ status }.`,
			() => {
				expect( status ).toBe( 200 );
			}
		);
	} );

	it( 'Browser console should not contain errors', async () => {
		// Haven't confirmed this works
		let jsError;

		page.on( 'pageerror', ( error ) => {
			jsError = error.toString();
		} );

		await page.goto( createURL( '/' ) );

		errorWithMessageOnFail(
			`Page should not contain javascript errors. Found ${ JSON.stringify(
				jsError
			) }`,
			() => {
				expect( jsError ).toBeFalsy();
			}
		);
	} );

	it( 'Page should not have unexpected links', async () => {
		// See https://make.wordpress.org/themes/handbook/review/required/#selling-credits-and-links

		await page.goto( createURL( url, queryString ) );

		const hrefs = await page.$$eval( 'a', ( anchors ) =>
			[].map.call( anchors, ( a ) => a.href )
		);

		const allowed_hosts = [
			'wordpress.org',
			'gravatar.com',
			'en.support.wordpress.com',
			'example.com',
			'example.org',
			'example.net',
			'wpthemetestdata.wordpress.com',
			'wpthemetestdata.files.wordpress.com',
			'codex.wordpress.org',
			'facebook.com',
			'www.facebook.com',
			'twitter.com',
			'', // mailto
			new URL( page.url() ).hostname,
		].concat( site_info.theme_urls.map( link => new URL ( link ).hostname ) ); // Allow for theme/author URLs.

		// TODO: improve this so that instead of including a blanket exception for facebook.com and the theme/author hostnames,
		// we have a separate whitelist containing URLs like https://facebook.com/sharing.php etc.
		hrefs.forEach( ( href ) => {
			let href_url = new URL( href, page.url() );
			errorWithMessageOnFail(
				`${ href_url.hostname } found on ${ getDefaultUrl(
					url,
					queryString.replace( '?', '' )
				) } is not an approved link.`,
				() => {
					expect( allowed_hosts ).toContain( href_url.hostname );
				}
			);
		} );
	} );
} );
