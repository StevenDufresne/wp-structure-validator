/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );

/**
 * Internal dependencies
 */
import urls from './pages';

const cleanErrorMessage = ( msg ) => {
	return msg.replace( 'expect(received).toPassAxeTests(expected)', '' );
}

const getDefaultUrl = ( path, query ) => {
	let defaultUrl = path;

	if( query.length > 1 ) {
		defaultUrl += `?${ query }`;
	}

	return `(${ defaultUrl })`;
}

describe( 'Accessibility', () => {

	it( "Must contain skip links", async () => {
		let activeElement;
		await page.goto( createURL( '/' ) );
		await page.keyboard.press('Tab');

		try {
			activeElement = await page.evaluate( () =>  {
				const el = document.activeElement;

				return {
					tag:el.tagName,
					text: el.innerText,
					isVisible: el.offsetHeight > 0 && el.offsetWidth > 0
				};
			} );
		} catch ( e ) {
			core.setFailed( `[ Accessibility - Required Tests ]: \n\nRunning tests on Home(/) \n\n Couldn't find skip links.` );
		}
		
		try {
			// Expect it to be visible
			expect( activeElement.tag ).toEqual( 'a' );
		} catch ( e ) {
			core.setFailed( `[ Accessibility - Required Tests ]: \n\nRunning tests on Home(/) \n\n First tab doesn't select a link` );
			return;
		}
		
		try {
			// Expect it to be visible
			expect( activeElement.isVisible ).toBeTruthy();
		} catch ( e ) {
			core.setFailed( `[ Accessibility - Required Tests ]: \n\nRunning tests on Home(/) \n\n Skip link is not visible` );
			return;
		}
		
		try {
			// Expect it to have the right copy
			expect( activeElement.text.toLowerCase().indexOf( 'skip' ) >= 0 ).toBeTruthy();
		} catch ( e ) {
			core.setFailed( `[ Accessibility - Required Tests ]: \n\nRunning tests on Home(/) \n\n Skip link doesn't contain the word 'Skip' ` );
			return;
		}

	} );

	// Required: These test must pass
	test.each( urls )(
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
						exclude: [ [ '.entry-content' ] ],
					},
				} );
			} catch ( e ) {
				core.setFailed( `[ Accessibility - Required Tests ]: \n\nRunning tests on ${ name }${ getDefaultUrl( path, query ) } using: \nhttps://github.com/wpaccessibility/a11y-theme-unit-test ${ cleanErrorMessage( e.message ) }` );
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
				core.warning( `[ Accessibility - Optional Tests ]: \n\nRunning tests on ${ name }${ getDefaultUrl( path, query ) } using: \nhttps://github.com/wpaccessibility/a11y-theme-unit-test ${ cleanErrorMessage( e.message ) }` );
			}
		}
	);
} );
