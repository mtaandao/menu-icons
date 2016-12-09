(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * mn.media.controller.IconPickerFont
 *
 * @class
 * @augments mn.media.controller.State
 * @augments Backbone.Model
 * @mixes    mn.media.controller.iconPickerMixin
 */
var IconPickerFont = mn.media.controller.State.extend( _.extend( {}, mn.media.controller.iconPickerMixin, {
	defaults: {
		multiple: false,
		menu:     'default',
		toolbar:  'select',
		baseType: 'font'
	},

	initialize: function() {
		var data = this.get( 'data' );

		this.set( 'groups', new Backbone.Collection( data.groups ) );
		this.set( 'library', new mn.media.model.IconPickerFonts( data.items ) );
		this.set( 'selection', new mn.media.model.Selection( null, {
			multiple: this.get( 'multiple' )
		}) );
	},

	activate: function() {
		this.frame.on( 'open', this.updateSelection, this );
		this.resetFilter();
		this.updateSelection();
	},

	deactivate: function() {
		this.frame.off( 'open', this.updateSelection, this );
	},

	resetFilter: function() {
		this.get( 'library' ).props.set( 'group', 'all' );
	},

	updateSelection: function() {
		var selection = this.get( 'selection' ),
		    library   = this.get( 'library' ),
		    target    = this.frame.target,
		    icon      = target.get( 'icon' ),
		    type      = target.get( 'type' ),
		    selected;

		if ( this.id === type ) {
			selected = library.findWhere({ id: icon });
		}

		selection.reset( selected ? selected : null );
	},

	getContentView: function() {
		return new mn.media.view.IconPickerFontBrowser( _.extend({
			controller: this.frame,
			model:      this,
			groups:     this.get( 'groups' ),
			collection: this.get( 'library' ),
			selection:  this.get( 'selection' ),
			baseType:   this.get( 'baseType' ),
			type:       this.get( 'id' )
		}, this.ipGetSidebarOptions() ) );
	}
}) );

module.exports = IconPickerFont;

},{}],2:[function(require,module,exports){
var Library = mn.media.controller.Library,
    l10n = mn.media.view.l10n,
    models = mn.media.model,
    views = mn.media.view,
    IconPickerImg;

/**
 * mn.media.controller.IconPickerImg
 *
 * @augments mn.media.controller.Library
 * @augments mn.media.controller.State
 * @augments Backbone.Model
 * @mixes    media.selectionSync
 * @mixes    mn.media.controller.iconPickerMixin
 */
IconPickerImg = Library.extend( _.extend( {}, mn.media.controller.iconPickerMixin, {
	defaults: _.defaults({
		id:            'image',
		baseType:      'image',
		syncSelection: false
	}, Library.prototype.defaults ),

	initialize: function( options ) {
		var selection = this.get( 'selection' );

		this.options = options;

		this.set( 'library', mn.media.query({ type: options.data.mimeTypes }) );

		this.routers = {
			upload: {
				text:     l10n.uploadFilesTitle,
				priority: 20
			},
			browse: {
				text:     l10n.mediaLibraryTitle,
				priority: 40
			}
		};

		if ( ! ( selection instanceof models.Selection ) ) {
			this.set( 'selection', new models.Selection( selection, {
				multiple: false
			}) );
		}

		Library.prototype.initialize.apply( this, arguments );
	},

	activate: function() {
		Library.prototype.activate.apply( this, arguments );
		this.get( 'library' ).observe( mn.Uploader.queue );
		this.frame.on( 'open', this.updateSelection, this );
		this.updateSelection();
	},

	deactivate: function() {
		Library.prototype.deactivate.apply( this, arguments );
		this.get( 'library' ).unobserve( mn.Uploader.queue );
		this.frame.off( 'open', this.updateSelection, this );
	},

	getContentView: function( mode ) {
		var content = ( 'upload' === mode ) ? this.uploadContent() : this.browseContent();

		this.frame.$el.removeClass( 'hide-toolbar' );

		return content;
	},

	/**
	 * Media library content
	 *
	 * @returns {mn.media.view.IconPickerImgBrowser} "Browse" content view.
	 */
	browseContent: function() {
		var options = _.extend({
			model:            this,
			controller:       this.frame,
			collection:       this.get( 'library' ),
			selection:        this.get( 'selection' ),
			sortable:         this.get( 'sortable' ),
			search:           this.get( 'searchable' ),
			filters:          this.get( 'filterable' ),
			dragInfo:         this.get( 'dragInfo' ),
			idealColumnWidth: this.get( 'idealColumnWidth' ),
			suggestedWidth:   this.get( 'suggestedWidth' ),
			suggestedHeight:  this.get( 'suggestedHeight' )
		}, this.ipGetSidebarOptions() );

		if ( 'svg' === this.id ) {
			options.AttachmentView = views.IconPickerSvgItem;
		}

		return new views.IconPickerImgBrowser( options );
	},

	/**
	 * Render callback for the content region in the `upload` mode.
	 *
	 * @returns {mn.media.view.UploaderInline} "Upload" content view.
	 */
	uploadContent: function() {
		return new mn.media.view.UploaderInline({
			controller: this.frame
		});
	},

	updateSelection: function() {
		var selection = this.get( 'selection' ),
		    target    = this.frame.target,
		    icon      = target.get( 'icon' ),
		    type      = target.get( 'type' ),
		    selected;

		if ( this.id === type ) {
			selected = models.Attachment.get( icon );
			this.dfd = selected.fetch();
		}

		selection.reset( selected ? selected : null );
	},

	/**
	 * Get image icon URL
	 *
	 * @param  {object} model - Selected icon model.
	 * @param  {string} size  - Image size.
	 *
	 * @returns {string} Icon URL.
	 */
	ipGetIconUrl: function( model, size ) {
		var url   = model.get( 'url' ),
		    sizes = model.get( 'sizes' );

		if ( undefined === size ) {
			size = 'thumbnail';
		}

		if ( sizes && sizes[ size ] ) {
			url = sizes[ size ].url;
		}

		return url;
	}
}) );

module.exports = IconPickerImg;

},{}],3:[function(require,module,exports){
/**
 * Methods for the state
 *
 * @mixin
 */
var iconPickerMixin = {

	/**
	 * @returns {object}
	 */
	ipGetSidebarOptions: function() {
		var frameOptions = this.frame.options,
		    options = {};

		if ( frameOptions.SidebarView && frameOptions.SidebarView.prototype instanceof mn.media.view.IconPickerSidebar ) {
			options.sidebar     = true;
			options.SidebarView = frameOptions.SidebarView;
		} else {
			options.sidebar = false;
		}

		return options;
	},

	/**
	 * Get image icon URL
	 *
	 * @returns {string}
	 */
	ipGetIconUrl: function() {
		return '';
	}
};

module.exports = iconPickerMixin;

},{}],4:[function(require,module,exports){
mn.media.model.IconPickerTarget = require( './models/target.js' );
mn.media.model.IconPickerFonts  = require( './models/fonts.js' );

mn.media.controller.iconPickerMixin = require( './controllers/mixin.js' );
mn.media.controller.IconPickerFont  = require( './controllers/font.js' );
mn.media.controller.IconPickerImg   = require( './controllers/img.js' );

mn.media.view.IconPickerBrowser     = require( './views/browser.js' );
mn.media.view.IconPickerSidebar     = require( './views/sidebar.js' );
mn.media.view.IconPickerFontItem    = require( './views/font-item.js' );
mn.media.view.IconPickerFontLibrary = require( './views/font-library.js' );
mn.media.view.IconPickerFontFilter  = require( './views/font-filter.js' );
mn.media.view.IconPickerFontBrowser = require( './views/font-browser.js' );
mn.media.view.IconPickerImgBrowser  = require( './views/img-browser.js' );
mn.media.view.IconPickerSvgItem     = require( './views/svg-item.js' );
mn.media.view.MediaFrame.IconPicker = require( './views/frame.js' );

},{"./controllers/font.js":1,"./controllers/img.js":2,"./controllers/mixin.js":3,"./models/fonts.js":5,"./models/target.js":6,"./views/browser.js":7,"./views/font-browser.js":8,"./views/font-filter.js":9,"./views/font-item.js":10,"./views/font-library.js":11,"./views/frame.js":12,"./views/img-browser.js":13,"./views/sidebar.js":14,"./views/svg-item.js":15}],5:[function(require,module,exports){
/**
 * mn.media.model.IconPickerFonts
 */
var IconPickerFonts = Backbone.Collection.extend({
	initialize: function( models ) {
		this.items = new Backbone.Collection( models );
		this.props = new Backbone.Model({
			group:  'all',
			search: ''
		});

		this.props.on( 'change', this.refresh, this );
	},

	/**
	 * Refresh library when props is changed
	 *
	 * @param {Backbone.Model} props
	 */
	refresh: function( props ) {
		var library = this,
		    items   = this.items.toJSON();

		_.each( props.toJSON(), function( value, filter ) {
			if ( library.filters[ filter ] ) {
				items = _.filter( items, _.bind( library.filters[ filter ], this ), value );
			}
		}, this );

		this.reset( items );
	},
	filters: {
		/**
		 * @static
		 * @param {object} item
		 *
		 * @this mn.media.model.IconPickerFonts
		 *
		 * @returns {Boolean}
		 */
		group: function( item ) {
			var groupId = this.props.get( 'group' );

			return ( 'all' === groupId || item.group === groupId || '' === item.group );
		},

		/**
		 * @static
		 * @param {object} item
		 *
		 * @this mn.media.model.IconPickerFonts
		 *
		 * @returns {Boolean}
		 */
		search: function( item ) {
			var term = this.props.get( 'search' ),
			    result;

			if ( '' === term ) {
				result = true;
			} else {
				result = _.any( [ 'id', 'name' ], function( key ) {
					var value = item[ key ];

					return value && -1 !== value.search( this );
				}, term );
			}

			return result;
		}
	}
});

module.exports = IconPickerFonts;

},{}],6:[function(require,module,exports){
/**
 * mn.media.model.IconPickerTarget
 *
 * A target where the picked icon should be sent to
 *
 * @augments Backbone.Model
 */
var IconPickerTarget = Backbone.Model.extend({
	defaults: {
		type:  '',
		group: 'all',
		icon:  '',
		url:   '',
		sizes: []
	}
});

module.exports = IconPickerTarget;

},{}],7:[function(require,module,exports){
/**
 * Methods for the browser views
 */
var IconPickerBrowser = {
	createSidebar: function() {
		this.sidebar = new this.options.SidebarView({
			controller: this.controller,
			selection:  this.options.selection
		});

		this.views.add( this.sidebar );
	}
};

module.exports = IconPickerBrowser;

},{}],8:[function(require,module,exports){
/**
 * mn.media.view.IconPickerFontBrowser
 */
var IconPickerFontBrowser = mn.media.View.extend( _.extend({
	className: function() {
		var className = 'attachments-browser iconpicker-fonts-browser';

		if ( ! this.options.sidebar ) {
			className += ' hide-sidebar';
		}

		return className;
	},

	initialize: function() {
		this.groups = this.options.groups;

		this.createToolbar();
		this.createLibrary();

		if ( this.options.sidebar ) {
			this.createSidebar();
		}
	},

	createLibrary: function() {
		this.items = new mn.media.view.IconPickerFontLibrary({
			controller: this.controller,
			collection: this.collection,
			selection:  this.options.selection,
			baseType:   this.options.baseType,
			type:       this.options.type
		});

		// Add keydown listener to the instance of the library view
		this.items.listenTo( this.controller, 'attachment:keydown:arrow',     this.items.arrowEvent );
		this.items.listenTo( this.controller, 'attachment:details:shift-tab', this.items.restoreFocus );

		this.views.add( this.items );
	},

	createToolbar: function() {
		this.toolbar = new mn.media.view.Toolbar({
			controller: this.controller
		});

		this.views.add( this.toolbar );

		// Dropdown filter
		this.toolbar.set( 'filters', new mn.media.view.IconPickerFontFilter({
			controller: this.controller,
			model:      this.collection.props,
			priority:   -80
		}).render() );

		// Search field
		this.toolbar.set( 'search', new mn.media.view.Search({
			controller: this.controller,
			model:      this.collection.props,
			priority:   60
		}).render() );
	}
}, mn.media.view.IconPickerBrowser ) );

module.exports = IconPickerFontBrowser;

},{}],9:[function(require,module,exports){
/**
 * mn.media.view.IconPickerFontFilter
 */
var IconPickerFontFilter = mn.media.view.AttachmentFilters.extend({
	createFilters: function() {
		var groups  = this.controller.state().get( 'groups' ),
		    filters = {};

		filters.all = {
			text:  mn.media.view.l10n.iconPicker.allFilter,
			props: { group: 'all' }
		};

		groups.each( function( group ) {
			filters[ group.id ] = {
				text:  group.get( 'name' ),
				props: { group: group.id }
			};
		});

		this.filters = filters;
	},

	change: function() {
		var filter = this.filters[ this.el.value ];

		if ( filter ) {
			this.model.set( 'group', filter.props.group );
		}
	}
});

module.exports = IconPickerFontFilter;

},{}],10:[function(require,module,exports){
var Attachment = mn.media.view.Attachment.Library,
    IconPickerFontItem;

/**
 * mn.media.view.IconPickerFontItem
 */
IconPickerFontItem = Attachment.extend({
	className: 'attachment iconpicker-item',

	initialize: function() {
		this.template = mn.media.template( 'iconpicker-' + this.options.baseType + '-item' );
		Attachment.prototype.initialize.apply( this, arguments );
	},

	render: function() {
		var options = _.defaults( this.model.toJSON(), {
			baseType: this.options.baseType,
			type:     this.options.type
		});

		this.views.detach();
		this.$el.html( this.template( options ) );
		this.updateSelect();
		this.views.render();

		return this;
	}
});

module.exports = IconPickerFontItem;

},{}],11:[function(require,module,exports){
var $ = jQuery,
    Attachments = mn.media.view.Attachments,
    IconPickerFontLibrary;

/**
 * mn.media.view.IconPickerFontLibrary
 */
IconPickerFontLibrary = Attachments.extend({
	className: 'attachments iconpicker-items clearfix',

	initialize: function() {
		Attachments.prototype.initialize.apply( this, arguments );

		_.bindAll( this, 'scrollToSelected' );
		_.defer( this.scrollToSelected, this );
		this.controller.on( 'open', this.scrollToSelected, this );
		$( this.options.scrollElement ).off( 'scroll', this.scroll );
	},

	_addItem: function( model ) {
		this.views.add( this.createAttachmentView( model ), {
			at: this.collection.indexOf( model )
		} );
	},

	_removeItem: function( model ) {
		var view = this._viewsByCid[ model.cid ];
		delete this._viewsByCid[ model.cid ];

		if ( view ) {
			view.remove();
		}
	},

	render: function() {
		_.each( this._viewsByCid, this._removeItem, this );
		this.collection.each( this._addItem, this );

		return this;
	},

	createAttachmentView: function( model ) {
		var view = new mn.media.view.IconPickerFontItem({
			controller: this.controller,
			model:      model,
			collection: this.collection,
			selection:  this.options.selection,
			baseType:   this.options.baseType,
			type:       this.options.type
		});

		return this._viewsByCid[ view.cid ] = view;
	},

	/**
	 * Scroll to selected item
	 */
	scrollToSelected: function() {
		var selected = this.options.selection.single(),
		    singleView, distance;

		if ( ! selected ) {
			return;
		}

		singleView = this.getView( selected );

		if ( singleView && ! this.isInView( singleView.$el ) ) {
			distance = (
				singleView.$el.offset().top -
				parseInt( singleView.$el.css( 'paddingTop' ), 10 ) -
				this.$el.offset().top +
				this.$el.scrollTop() -
				parseInt( this.$el.css( 'paddingTop' ), 10 )
			);

			this.$el.scrollTop( distance );
		}
	},

	getView: function( model ) {
		return _.findWhere( this._viewsByCid, { model: model } );
	},

	isInView: function( $elem ) {
		var docViewTop    = this.$window.scrollTop(),
		    docViewBottom = docViewTop + this.$window.height(),
		    elemTop       = $elem.offset().top,
		    elemBottom    = elemTop + $elem.height();

		return ( ( elemBottom <= docViewBottom ) && ( elemTop >= docViewTop ) );
	},

	prepare: function() {},
	ready: function() {},
	initSortable: function() {},
	scroll: function() {}
});

module.exports = IconPickerFontLibrary;

},{}],12:[function(require,module,exports){
/**
 * mn.media.view.MediaFrame.IconPicker
 *
 * A frame for selecting an icon.
 *
 * @class
 * @augments mn.media.view.MediaFrame.Select
 * @augments mn.media.view.MediaFrame
 * @augments mn.media.view.Frame
 * @augments mn.media.View
 * @augments mn.Backbone.View
 * @augments Backbone.View
 * @mixes mn.media.controller.StateMachine
 */

var l10n = mn.media.view.l10n,
    Select = mn.media.view.MediaFrame.Select,
	IconPicker;

IconPicker = Select.extend({
	initialize: function() {
		_.defaults( this.options, {
			title:       l10n.iconPicker.frameTitle,
			multiple:    false,
			ipTypes:     iconPicker.types,
			target:      null,
			SidebarView: null
		});

		if ( this.options.target instanceof mn.media.model.IconPickerTarget ) {
			this.target = this.options.target;
		} else {
			this.target = new mn.media.model.IconPickerTarget();
		}

		Select.prototype.initialize.apply( this, arguments );
	},

	createStates: function() {
		var Controller;

		_.each( this.options.ipTypes, function( props ) {
			if ( ! mn.media.controller.hasOwnProperty( 'IconPicker' + props.controller ) ) {
				return;
			}

			Controller = mn.media.controller[ 'IconPicker' + props.controller ];

			this.states.add( new Controller({
				id:      props.id,
				content: props.id,
				title:   props.name,
				data:    props.data
			}) );
		}, this );
	},

	/**
	 * Bind region mode event callbacks.
	 */
	bindHandlers: function() {
		this.on( 'router:create:browse', this.createRouter, this );
		this.on( 'router:render:browse', this.browseRouter, this );
		this.on( 'content:render', this.ipRenderContent, this );
		this.on( 'toolbar:create:select', this.createSelectToolbar, this );
		this.on( 'open', this._ipSetState, this );
		this.on( 'select', this._ipUpdateTarget, this );
	},

	/**
	 * Set state based on the target's icon type
	 */
	_ipSetState: function() {
		var stateId = this.target.get( 'type' );

		if ( ! stateId || ! this.states.findWhere( { id: stateId } ) ) {
			stateId = this.states.at( 0 ).id;
		}

		this.setState( stateId );
	},

	/**
	 * Update target's attributes after selecting an icon
	 */
	_ipUpdateTarget: function() {
		var state    = this.state(),
			selected = state.get( 'selection' ).single(),
			props;

		props = {
			type:  state.id,
			icon:  selected.get( 'id' ),
			sizes: selected.get( 'sizes' ),
			url:   state.ipGetIconUrl( selected )
		};

		this.target.set( props );
	},

	browseRouter: function( routerView ) {
		var routers = this.state().routers;

		if ( routers ) {
			routerView.set( routers );
		}
	},

	ipRenderContent: function() {
		var state   = this.state(),
		    mode    = this.content.mode(),
		    content = state.getContentView( mode );

		this.content.set( content );
	}
});

module.exports = IconPicker;

},{}],13:[function(require,module,exports){
/**
 * mn.media.view.IconPickerImgBrowser
 */
var IconPickerImgBrowser = mn.media.view.AttachmentsBrowser.extend( mn.media.view.IconPickerBrowser );

module.exports = IconPickerImgBrowser;

},{}],14:[function(require,module,exports){
/**
 * mn.media.view.IconPickerSidebar
 */
var IconPickerSidebar = mn.media.view.Sidebar.extend({
	initialize: function() {
		var selection = this.options.selection;

		mn.media.view.Sidebar.prototype.initialize.apply( this, arguments );

		selection.on( 'selection:single', this.createSingle, this );
		selection.on( 'selection:unsingle', this.disposeSingle, this );

		if ( selection.single() ) {
			this.createSingle();
		}
	},

	/**
	 * @abstract
	 */
	createSingle: function() {},

	/**
	 * @abstract
	 */
	disposeSingle: function() {}
});

module.exports = IconPickerSidebar;

},{}],15:[function(require,module,exports){
/**
 * mn.media.view.IconPickerSvgItem
 */
var IconPickerSvgItem = mn.media.view.Attachment.Library.extend({
	template: mn.template( 'iconpicker-svg-item' )
});

module.exports = IconPickerSvgItem;

},{}]},{},[4]);

'use strict';

(function( $ ) {
	var l10n = mn.media.view.l10n.iconPicker,
		templates = {},
		frame, selectIcon, removeIcon, getFrame, updateField, updatePreview, $field;

	getFrame = function() {
		if ( ! frame ) {
			frame = new mn.media.view.MediaFrame.IconPicker();

			frame.target.on( 'change', updateField );
		}

		return frame;
	};

	updateField = function( model ) {
		_.each( model.get( 'inputs' ), function( $input, key ) {
			$input.val( model.get( key ) );
		});

		model.clear({ silent: true });
		$field.trigger( 'ipf:update' );
	};

	updatePreview = function( e ) {
		var $el     = $( e.currentTarget ),
		    $select = $el.find( 'a.ipf-select' ),
		    $remove = $el.find( 'a.ipf-remove' ),
		    type    = $el.find( 'input.ipf-type' ).val(),
		    icon    = $el.find( 'input.ipf-icon' ).val(),
		    url     = $el.find( 'input.url' ).val(),
		    template;

		if ( '' === type || '' === icon || ! _.has( iconPicker.types, type ) ) {
			$remove.addClass( 'hidden' );
			$select
				.removeClass( 'has-icon' )
				.addClass( 'button' )
				.text( l10n.selectIcon )
				.attr( 'title', '' );

			return;
		}

		if ( templates[ type ] ) {
			template = templates[ type ];
		} else {
			template = templates[ type ] = mn.template( 'iconpicker-' + iconPicker.types[ type ].templateId + '-icon' );
		}

		$remove.removeClass( 'hidden' );
		$select
			.attr( 'title', l10n.selectIcon )
			.addClass( 'has-icon' )
			.removeClass( 'button' )
			.html( template({
				type: type,
				icon: icon,
				url:  url
			}) );
	};

	selectIcon = function( e ) {
		var frame = getFrame(),
			model = { inputs: {} };

		e.preventDefault();

		$field   = $( e.currentTarget ).closest( '.ipf' );
		model.id = $field.attr( 'id' );

		// Collect input fields and use them as the model's attributes.
		$field.find( 'input' ).each( function() {
			var $input = $( this ),
			    key    = $input.attr( 'class' ).replace( 'ipf-', '' ),
			    value  = $input.val();

			model[ key ]        = value;
			model.inputs[ key ] = $input;
		});

		frame.target.set( model, { silent: true } );
		frame.open();
	};

	removeIcon = function( e ) {
		var $el = $( e.currentTarget ).closest( 'div.ipf' );

		$el.find( 'input' ).val( '' );
		$el.trigger( 'ipf:update' );
	};

	$( document )
		.on( 'click', 'a.ipf-select', selectIcon )
		.on( 'click', 'a.ipf-remove', removeIcon )
		.on( 'ipf:update', 'div.ipf', updatePreview );

	$( 'div.ipf' ).trigger( 'ipf:update' );
}( jQuery ) );
