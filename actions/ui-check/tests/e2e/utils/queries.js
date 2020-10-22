/**
 * Retrieves list elements that are focusable by keyboard from the DOM
 * @return {array} List of focusable element
 */
const queryForFocusableElementsAsync = async () => {
	return await page.$$(
		'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
	);
};

/**
 * Returns whether the element is visible
 * @param {Puppeteer|ElementHandle} element
 * @return {boolean} List of focusable element
 */
export const elementIsVisibleAsync = async ( element ) => {
	// If the bounding box is null, it's not visible
	return ( await element.boundingBox() ) !== null;
};

/**
 * Return property for element
 * @param {Puppeteer|ElementHandle} element
 * @param {string} property name of the html property
 */
export const getElementPropertyAsync = async ( element, property ) => {
	return await ( await element.getProperty( property ) ).jsonValue();
};

/**
 * Retrieves list elements that are focusable by keyboard from the DOM excluding hidden & disabled elements.
 * @return {Puppeteer|ElementHandle[]} List of focusable element
 */
export const getFocusableElementsAsync = async () => {
	const elements = await queryForFocusableElementsAsync();
	const final = [];

	for ( let i = 0; i < elements.length; i++ ) {
		// Check if it disabled
		const disabled = await (
			await elements[ i ].getProperty( 'disabled' )
		 ).jsonValue();

		if ( ! disabled && ( await elementIsVisibleAsync( elements[ i ] ) ) ) {
			final.push( elements[ i ] );
		}
	}

	return final;
};

/**
 * Retrieves list elements that are tabbing by keyboard.
 * @return {Puppeteer|ElementHandle[]} List of tabbable element
 */
export const getTabbableElementsAsync = async () => {
	const elements = await queryForFocusableElementsAsync();
	const final = [];

	for ( let i = 0; i < elements.length; i++ ) {
		const element = await page.evaluate( ( el ) => {
			/**
			 * Returns whether element is visible
			 * @param {HTMLelement} element
			 * @returns {boolean}
			 */
			const isVisible = ( element ) => {
				const rect = element.getBoundingClientRect();
				return ! (
					rect.x <= 0 ||
					rect.y - window.innerHeight >= 0 ||
					( rect.width === 0 && rect.height === 0 )
				);
			};

			/**
			 * Crawls upward looking for the outermost <ul> element
			 * @param {HTMLElement} element
			 * @returns {HTMLElement}
			 */
			const getOutermostUl = ( element ) => {
				var parent = element.parentElement.closest( 'ul' );

				if ( parent === null ) {
					return element;
				}

				return getOutermostUl( parent );
			};

			// Is it most likely a nav item?
			let parent = getOutermostUl( el );

			return {
				tagName: el.tagName,
				disabled: el.disabled,
				href: el.href,
				innerText: el.innerText,
				isLikelyNavItem: parent !== el && isVisible( parent ),
			};
		}, elements[ i ] );

		// Disabled elements will not get tabbing focus
		if ( element.disabled ) {
			continue;
		}

		// Links without hrefs will not get tabbing focus
		if ( element.tagName.toLowerCase() === 'a' && ! element.href ) {
			continue;
		}

		// Only include hidden elements if they are most likely part of navigation
		if (
			! ( await elementIsVisibleAsync( elements[ i ] ) ) &&
			! element.isLikelyNavItem
		) {
			continue;
		}

		final.push( elements[ i ] );
	}

	return final;
};
