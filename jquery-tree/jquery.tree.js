/**
 * formatFamilyTree
 * 
 * Copyright (c) 2011 Craig McIntosh -- craigmc.info
 * This work is licensed under a Creative Commons Attribution 2.5 Canada License:
 *      http://creativecommons.org/licenses/by/2.5/ca/
 
 * Dependencies: jQuery, bgImages plug-in
 */

/**
 * Applies required family tree formatting to any lists of the given class.
 * See configuration variables below.
 * 
 * @example $('ul.family').familyTree({bg_color: 'skyblue'});
 * @desc Formats a family tree on a skyblue background
 *
 * @param Object options An object literal containing the following optional keys:
 * @option String partner_selector The jQuery selector used to choose partner lists. Default: ul.partners
 * @option String children_selector The jQuery selector used to choose child lists. Default: ul.children
 * @option String bg_color The CSS stying to apply as the elements' background color where required. Default: #FFFFFF 
 * @option String has_children_class The CSS class to add to any child-bearing partner. Default: has-children
 * @option String directory Optional directory toprepend to all image files. Default: ''
 * @option String mp_top_image	Default: 'multiple-partners-top.png'
 * @option String mp_bottom_image Default: 'multiple-partners-bottom.png'
 * @option String mp_pending_image Default: 'pending-partner.png'
 * @option String single_parent_image Default: 'single-parent-root.png'
 * @option String vertical_line_image Default: 'dot.jpg'
 * @option String shiftable_images Comma-separated list of remaining connective images. Default: 'nuclear-root.png,childless-root.png,single-parent-root.png'
 * @option Int image_width Standard width in pixels. Default: 5
 * @option Int image_height Standard height in pixels. Default: 5
 * @option String bg_color Default: '#FFFFFF'
 * 
 * @author Craig McIntosh -- craigmc.info
 */ 
(function($) {
	//"use strict";

	$.fn.familyTree = function( o ) {
	
		var vars = $.extend($.fn.familyTree.defaults, o);
					
		// Add has-children class to those partners which it describes
		$(vars.partner_selector + ' > li:has(' + vars.children_selector + ')', this).addClass(vars.has_children_class);
		
		// Add multiple-partners images
		handleMultiplePartners( this );
		
		// Add single-parent imagery to parent's kids
		handleSingleParentsKids( this );
	
		// Indent partners' partners images
		handlePartnersOfPartners( this );
	
		// Separate partners sole children from their shared children (first list is not shared)
		handleMultipleChildGroups( this );
		
		// Add extended line to the left of partners who have their own partners
		handlePartnersWithPartners( this );

		return this;
	
		/** Member Functions Ahoy **/
				
		// For individuals with multiple partners, shift each partner's background to the right 
		// and add the multiple-partners images on the left.
		function handleMultiplePartners( trees ) {
			$(vars.partner_selector + ' > li:not(:only-child)', trees).each(function(){
				var target = $(this);
				var number = target.nextAll().length;	// How many partners follow this one?
				
				// The bottom image should be placed just above the first list of children
				var children = target.children(vars.children_selector).first();
				var bottom = children.length > 0 
					? children.position().top - target.position().top 
					: target.get(0).offsetHeight - parseInt(target.css('padding-bottom'));
					
				for(var i = 0; i < number; i++) {
					target.bgImages(
						bgVars({add: vars.mp_bottom_image, position: ( i * vars.image_width )+'px '+bottom+'px'}) );
					target.bgImages(
						bgVars({add: vars.mp_top_image, position: ( i * vars.image_width )+'px 0px', left: '0px'}) );
				}
			});
		}
		
		// Must perform similar behaviour as addMultiplePartners for immediate children of single parents.
		// 'number' here is the full number of parents to follow, and the image to add is different.
		function handleSingleParentsKids( trees ) {
			$(vars.partner_selector + ' > li:not(:only-child)', trees).each(function(){
				var target = $(this);
				var number = target.next(vars.partner_selector).children().length;
				for(var i = 0; i < number; i++) {
					target.bgImages(
						bgVars({add: vars.mp_pending_image, position: ( i * vars.image_width )+'px 0px'}) );
				}
			});
		}
		
		// Partners of partners need to have the connector to the sub-partner indented,
		// and a background color added to white-out redundant lines
		function handlePartnersOfPartners( trees ) {
			$(vars.partner_selector + ' > li > ' + vars.partner_selector, trees)
				.css('background-color', vars.bg_color)
				.prevAll()
				.bgImages(
					bgVars({add: vars.mp_pending_image, position: vars.image_width + 'px 0px', repeat: 'repeat-y'}) );
		}
	
		// If a partner has more than one child list, only the first is considered to belong to the parent.
		// The rest must have linking lines added	
		function handleMultipleChildGroups( trees ) { 
			$(vars.partner_selector + ' > li > ' + vars.children_selector + ':not(:first-child)', trees)
			.each(function(){
				if($(this).prevAll(vars.children_selector).length > 0) {
					$(this).bgImages(
						bgVars({add: vars.single_parent_image, 
							   position: vars.image_width+'px -'+(vars.image_height/2+1)+'px'})
					).prevAll(vars.children_selector).bgImages(
						bgVars({add: vars.vertical_line_image, 
							   position: (vars.image_width*1.5-1)+'px 0px', repeat: 'repeat-y'})
					);
				}
			});
		}

		// If a partner with children has their own partner, 
		// we need lines to span their children with the parent partner.
		function handlePartnersWithPartners( trees ) {
			$(vars.partner_selector + ' > li:has(' + vars.children_selector + '):has(' + vars.partner_selector + ')', trees).each(function(){
				var target = $(this);
				var number = $(target.children(vars.partner_selector)).children().length;
				
				// Subpartners are currently indented a width equal to image_width, but this is not required;
				// so long as the width is in pixles, we can auto-detect and add it here.
				var padding = 0;
				var subpartner_margin = $(target.children(vars.partner_selector)).css('margin-left');
				if(!!subpartner_margin && subpartner_margin.indexOf('px') > -1) padding += parseInt(subpartner_margin);
				var subpartner_padding = $(target.children(vars.partner_selector)).css('padding-left');
				if(!!subpartner_padding && subpartner_padding.indexOf('px') > -1) padding += parseInt(subpartner_padding);
				
				for(var i = 0; i < number; i++) {
					target.children(vars.children_selector)
						.bgImages( bgVars({add: vars.mp_pending_image, 
									position: ( padding + i * vars.image_width )+'px 0px'}) );
				}
			});
		}
		
		// Retrive standard args for bgImages call, extended with args object
		function bgVars( args ) {
			var merged = {
				tags: vars.shiftable_images,
				left: vars.image_width + 'px'
			};
			if( typeof(args) == 'object' ) {
				// extend
				merged = $.extend( merged, args );
				
				// Add directory to any image in merged
				var image_args = [vars.mp_top_image, vars.mp_bottom_image, vars.mp_pending_image,
					vars.single_parent_image, vars.vertical_line_image];
				for( arg in merged ) {
					if( $.inArray(merged[arg], image_args) > -1) {
						merged[arg] = vars.directory + '/' + merged[arg];
					}
				}
			}
			return merged;
		}
					
	};
	
	$.fn.familyTree.defaults = {
		
		// CSS Selectors
		partner_selector: 		'ul.partners',
		children_selector: 		'ul.children', 
		has_children_class: 		'has-children',
		
		// Image files
		directory:			'jquery-tree/images',
		mp_top_image:			'multiple-partners-top.png',
		mp_bottom_image: 		'multiple-partners-bottom.png',
		mp_pending_image:	 	'pending-partner.png',
		single_parent_image:		'single-parent-root.png',
		vertical_line_image:		'dot.jpg',
		shiftable_images: 		'nuclear-root.png,childless-root.png,single-parent-root.png',
		
		// Standard image dimensions (px)
		image_width:			5,
		image_height: 			5,
		
		// Background colour for elements
		bg_color: '#FFFFFF'
		
	};

})(jQuery);
