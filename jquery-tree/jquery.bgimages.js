/**
 * bgImages
 *
 * Copyright (c) 2011 Craig McIntosh -- craigmc.info
 * This work is licensed under a Creative Commons Attribution 2.5 Canada License:
 *      http://creativecommons.org/licenses/by/2.5/ca/
 */

/**
 * Handles editting of multiple background images for an element, as permitted by CSS3.
 * Currently supports adding a new background image, and shifting existing background images 
 * relative to their current position.
 * Future features may include deleting existing background images, and arbitrary repositionning.
 *
 * NOTE: All options' defaults may be changed by accessing the bgImages.defaults object.
 *		 EG: $.fn.bgImages.defaults.move_units = ['em', 'px'];
 *
 * @example $('div').bgImages({add: 'img_name.jpg'});
 * @desc Add an image to the top left corner of all divs.
 *
 * @param {Object} options An object literal containing the following optional keys:
 * @option {string} add The URL (relative or absolute) of an image to be added to the background.
 * @option {string} position The position attribute to apply to any added image. Defaults to 0px 0px.
 * @option {string} repeat The repeat attribute to apply to any added image. Defaults to no-repeat.
 * @option {array} tags Any images whose full path ends in a string contained in this array will be tagged.
 * @option {boolean} shift_tagged If true, all tagged images will be shifted 
 		as defined by 'left' and 'right' options. If false, all untagged images will be so shifted.
 * @option {string} left The amount to shift eligable images to the left, w/ units. Defaults to 0px (no shift).
 * @option {string} right The amount to shift eligable images to the right, w/ units. Defaults to 0px (no shift).
 *
 * @name $.bgImages
 * @author Craig McIntosh -- craigmc.info
 */

(function($) {
	//"use strict";
	$.fn.bgImages = function( o ) {
		var opts = $.extend( {}, $.fn.bgImages.defaults, o );
		// It may be inefficient, but we always run shift_background_images,
		// because add_background_image expects the attributes to be normalized.
		this.focus();
		var al = 'call with: ';
		for( var prop in opts ) {
			al += ', \n' + prop + ': ' + opts[prop];
		}
		//alert(al);
		
		shift_background_images( this );
		if( opts.add ) {
			add_background_image( this );
		}
		return this;
		
		/**
		 * Move existing background images relative to their current position.
		 * @param {jQuery} target the object whose background we are to manipulate.
		 */		
		function shift_background_images( target ) {
			// These will become our new attribute values
			var image_string = '', position_string = '', repeat_string = '';

			// Collect existing attribute data	
			var images = get_cs_attr_array(target, 'background-image');
			var repeats = get_cs_attr_array(target, 'background-repeat');
			var positions = get_cs_attr_array(target, 'background-position');
						
			// Iterate over images, and create new attributes to match
			if( $.isArray(images) ) {
				for( var image_i = 0; image_i < images.length; image_i++ ) {
					image = $.trim( images[image_i] );
					if( image !== '' ) {
						// If image is marked for removal, just skip over it.
						if( typeof(opts.remove) !== 'string' || !image_is_tagged(image, opts.remove) ) {
							// Otherwise, add these settings to our new attribute value strings...
							var sep = image_string == '' ? '' : ',';
							image_string += sep + image;
							repeat_string += sep + get_wrapped_index( repeats, image_i, opts.default_repeat );
							debug( opts.shift_tagged ? 'We want to shift tagged images' : 'We want to shift untagged images' );
							if( opts.shift_tagged == image_is_tagged(image, opts.tags) ) {
								// If both true OR both false, we shift.
								position_string += sep + shift_position_string( 
									get_wrapped_index( positions, image_i, opts.default_position )
								);
							} else {
								position_string += sep + get_wrapped_index( positions, image_i, opts.default_position );
							}
						} else {
							debug( 'Removing image ' + image );
						}
					} 
				}
			}
			
			// Apply our new image strings to the target
			target.css('background-image', image_string);
			target.css('background-position', position_string);
			target.css('background-repeat', repeat_string);
		};
		
		/** 
		 * In cases where a CSS attribute consists of multiple comma-separated 
		 * elements, returns the attribute split / exploded into an array
		 * @param {jQuery} target The element whose CSS we will inspect
		 * @param {string} attr The target to retrieve / split
		 * @return {Array} The attribute split on ',', or an empty array
		 */
		function get_cs_attr_array(target, attr) {
			var val = target.css(attr);
			return val == null || val == '' ? [] : val.split(',');
		}
		
		/**
		 * Returns the value of the given array at the given index mod the array's length.
		 * @param {Array} arr The array to index
		 * @param {number} index The index
		 * @param {mixed} def The default value
		 * @return {mixed} returns the value at arr[index%arr.length] if successful, def otherwise.
		 */
		function get_wrapped_index(arr, index, def) {
			return $.isArray(arr) && arr.length > 0 
				? arr[ index % arr.length ]
				: def;
		}
		
		/**
		 * Determines whether a given image matches the tags specified in options.
		 * @param {string} image The image file name to test.
		 * @return {boolean} True if image matches a tag, false otherwise.
		 */
		function image_is_tagged(image, tags) {
			debug( 'Checking is image "'+image+'" is tagged by "'+tags+'"' );
			if( typeof(tags) == 'string' ) tags = tags.split(',');
			if(i_string = /^\s*url\(['"]?([^'")]*)["']?\)\s*$/.exec(image)) {
				image = i_string[1];
			} 
			for( var t_index = 0; t_index < tags.length; t_index++ ) {
				tag = tags[t_index];
				debug( 'checking "'+image.substr(image.length - tag.length)+'" against "'+tag+'"' );
				if( image.length >= tag.length && image.substr(image.length - tag.length) === tag ) {
					debug( 'Image is tagged' );
					return true;
				}
			}
			debug( 'Image is not tagged' );
			return false;
		}
		
		/**
		 * Shifts the given CSS position substring based on values in opts array.
		 * @param {string} position A CSS substring representing the position of a single image.
		 * @return {string} The same substring, shifted as required.
		 */
		function shift_position_string( position ) {
			var position_values = $.trim( position ).replace( /s+/, ' ' ).split(' ');	
			
			var xval = shift_single_position( position_values[0], opts.left );
			var yval = shift_single_position( position_values[1], opts.top );

			return $.trim( xval + ' ' + yval );
		}
		
		/**
		 * Adds the given shift value to the given position string.
		 * @param {string} position A CSS substring representing a v-pos or h-pos.
		 * @param {string} shift_value The value to add onto position.
		 * @return {string} string_position with shift_value added on, iff the units are compatable;
		 * 		An empty string if position is invalid; otherwise position initial value.
		 */
		function shift_single_position( position, shift_value ) {
			if( typeof( position ) !== 'string' ) return '';
			var numUnitPattern = new RegExp( /^([+-]?\d*)(px|em|%)?$/ ); 
			var pos_parts = numUnitPattern.exec( position );
			var shift_parts = numUnitPattern.exec( shift_value );
			if( pos_parts != null && shift_parts != null ) {
				// Only shift in the event of compatable units.
				if( pos_parts[2] === shift_parts[2] 
				|| pos_parts[2] == null && shift_parts[2] == 'px'
				|| pos_parts[2] == 'px' && shift_parts[2] == null) {
					debug( 'Shifting image by adding '+shift_parts[1]+' to '+pos_parts[1] );
					return parseFloat( pos_parts[1] ) + parseFloat( shift_parts[1] ) + shift_parts[2];
				} else {
					debug( 'Not shifting image due to unit conflict: '+pos_parts[2]+' vs '+shift_parts[2] );
					// TODO: Handle conversions between units here?
				}
			} else {
				debug( 'Not shifting image due to invalid string "'+position+'" or "'+shift_value+'"' );
			}
			return position;
		}
		
		/**
		 * Adds the given background image to the target.
		 * @param {jQuery} target The target object
		 */
		function add_background_image( target ) {
			debug( 'adding ' + opts.add + ' to target ' + target.html() );
			add_cs_attribute( target, 'background-image', 'url(' + opts.add + ')' );
			add_cs_attribute( target, 'background-position', opts.position );
			add_cs_attribute( target, 'background-repeat', opts.repeat );
		};
		
		/**
		 * Adds a value to the start of a comma-separated CSS attribute list.
		 * @param {jQuery} target The tagret whose CSS we want to edit
		 * @param {string} attr The attribute name we want to edit
		 * @param {string} value The value we want to prepend
		 */
		function add_cs_attribute( target, attr, value ) {
			var old = target.css( attr );
			var sep = old != null && old != '' ? ',' : '';
			debug( 'setting '+attr+' to ' + value + sep + old );
			target.css( attr, value + sep + old );
		}
		
		function debug( s ) {
			if( opts.debug ) console.log( s );
		}
				
	}; // END $.fn.bgImages
		
	$.fn.bgImages.defaults = {
		add: 		false,
		remove:		false,
		position: 	'0px 0px',
		repeat: 	'no-repeat',
		tags:		'',
		shift_tagged: true,
		left: 		'0px',
		top:		'0px',
		// Defaults to use where an attribute is not set
		default_position: '0px 0px',
		default_repeat: 'repeat-x repeat-y',
		default_image: null,
		// Debug output to console
		debug:		false
	};
	
})(jQuery);