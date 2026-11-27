<?php
namespace ALSV_Splat_Viewer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// 3D scans for the Classic Editor, WooCommerce product descriptions and page builders: 3D Scans → All Scans holds one
// Splat Viewer block per scan (set up in the block editor), and [softicon_splat id="123"] shows it anywhere a shortcode
// works, with any of its settings changed for that place (options()). The same way as SoftIcon Flipbook.
class Shortcode {

	const TYPE = 'alsv_scan';
	const TAG  = 'softicon_splat';

	// the values a setting can take, where block.json has no list
	const CHOICES = array(
		'loadMode' => Block::LOADS,
		'quality'  => Block::QUALITY,
	);

	public function __construct() {
		add_action( 'init', array( $this, 'post_type' ) );
		add_shortcode( self::TAG, array( $this, 'render' ) );
		add_filter( 'manage_' . self::TYPE . '_posts_columns', array( $this, 'columns' ) );
		add_action( 'manage_' . self::TYPE . '_posts_custom_column', array( $this, 'column' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( $this, 'copy_script' ) );
		// Elementor's editor preview: the viewer script and styles from the start, so a Shortcode widget shows its scan at once
		add_action( 'elementor/preview/enqueue_styles', array( $this, 'builder_preview' ) );
		// a scan is set up in its block, so it always opens in the block editor, even where the Classic Editor
		// plugin (priority 100) switches every other post type to the classic one
		add_filter( 'use_block_editor_for_post_type', array( $this, 'block_editor' ), 200, 2 );
	}

	public function block_editor( $use, $type ) {
		return self::TYPE === $type ? true : $use;
	}

	public function builder_preview() {
		wp_enqueue_script( generate_block_asset_handle( Block::NAME, 'viewScript' ) );
		wp_enqueue_style( generate_block_asset_handle( Block::NAME, 'style' ) );
	}

	// not a page of its own on the site: a scan shows only where its shortcode is
	public function post_type() {
		register_post_type(
			self::TYPE,
			array(
				'labels'          => array(
					'name'                   => __( '3D Scans', 'softicon-splat-viewer' ),
					'singular_name'          => __( '3D Scan', 'softicon-splat-viewer' ),
					'menu_name'              => __( '3D Scans', 'softicon-splat-viewer' ),
					'add_new'                => __( 'Add a scan', 'softicon-splat-viewer' ),
					'add_new_item'           => __( 'Add a scan', 'softicon-splat-viewer' ),
					'edit_item'              => __( 'Edit scan', 'softicon-splat-viewer' ),
					'all_items'              => __( 'All Scans', 'softicon-splat-viewer' ),
					'not_found'              => __( 'No scans yet.', 'softicon-splat-viewer' ),
					'not_found_in_trash'     => __( 'No scans in the trash.', 'softicon-splat-viewer' ),
					'search_items'           => __( 'Search scans', 'softicon-splat-viewer' ),
					'new_item'               => __( 'New scan', 'softicon-splat-viewer' ),
					'view_item'              => __( 'View scan', 'softicon-splat-viewer' ),
					'item_published'         => __( 'Scan published.', 'softicon-splat-viewer' ),
					'item_updated'           => __( 'Scan updated.', 'softicon-splat-viewer' ),
					'item_reverted_to_draft' => __( 'Scan reverted to draft.', 'softicon-splat-viewer' ),
					'item_scheduled'         => __( 'Scan scheduled.', 'softicon-splat-viewer' ),
					'items_list'             => __( 'Scans list', 'softicon-splat-viewer' ),
					'filter_items_list'      => __( 'Filter scans list', 'softicon-splat-viewer' ),
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'menu_position'   => 11,
				// the block's icon: a cube of dots
				'menu_icon'       => 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="black" fill-rule="evenodd" d="M12 2.2 20.5 7v10L12 21.8 3.5 17V7zm0 1.7L5 7.9v8.2l7 4 7-4V7.9z"/><circle fill="black" cx="9" cy="10" r="1.3"/><circle fill="black" cx="14.2" cy="9" r="1.1"/><circle fill="black" cx="12" cy="13.6" r="1.5"/><circle fill="black" cx="15.6" cy="13.8" r=".9"/><circle fill="black" cx="9.4" cy="15.4" r=".9"/></svg>' ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- an icon, as WordPress asks for it
				'show_in_rest'    => true,
				'capability_type' => 'page',
				'map_meta_cap'    => true,
				'supports'        => array( 'title', 'editor' ),
				'template'        => array( array( Block::NAME ) ),
				'template_lock'   => 'all',
			)
		);
	}

	public function render( $atts ) {
		$id   = is_array( $atts ) && isset( $atts['id'] ) ? absint( $atts['id'] ) : 0;
		$scan = $id ? get_post( $id ) : null;
		// only a published scan without a password, never another post or a draft (as core's Pattern block)
		if ( ! $scan || self::TYPE !== $scan->post_type || 'publish' !== $scan->post_status || '' !== $scan->post_password ) {
			return '';
		}

		list( $options, $wrong ) = self::options( $atts );

		$html = '';
		foreach ( parse_blocks( $scan->post_content ) as $block ) {
			if ( Block::NAME === $block['blockName'] ) {
				$block['attrs'] = array_merge( is_array( $block['attrs'] ) ? $block['attrs'] : array(), $options );
				$html          .= render_block( $block );
			}
		}

		// a name or value that does nothing is told to whoever can edit the scan, never to visitors
		if ( $wrong && '' !== $html && current_user_can( 'edit_post', $scan->ID ) ) {
			/* translators: %s: the shortcode options that were left out, such as "heigth, load=later" */
			$html = '<p class="alsv-shortcode-note" style="margin:0 0 8px;padding:8px 12px;border-left:3px solid #d97706;background:#fffbeb;color:#1e1e1e;font-size:14px">' . esc_html( sprintf( __( '3D scan shortcode: left out %s (a setting the shortcode cannot change, or a value it cannot take). Only people who can edit this scan see this note.', 'softicon-splat-viewer' ), implode( ', ', $wrong ) ) ) . '</p>' . $html;
		}
		return $html;
	}

	// [softicon_splat id="123" load="click"]: the scan's settings changed for this one place, by their block names in
	// any case, with or without _ or - (WordPress lowercases them); a bare name turns one on. Only the block's plain
	// settings (yes/no, numbers, words), never the file, and Block::data() cleans them as it does the block's own.
	public static function options( $atts ) {
		$type  = \WP_Block_Type_Registry::get_instance()->get_registered( Block::NAME );
		$names = array( 'load' => 'loadMode' );
		foreach ( $type ? $type->attributes : array() as $name => $schema ) {
			if ( isset( $schema['type'] ) && in_array( $schema['type'], array( 'boolean', 'number', 'string' ), true ) ) {
				$names[ self::key( $name ) ] = $name;
			}
		}
		$names   = apply_filters( 'alsv_shortcode_attributes', $names );
		$options = array();
		$wrong   = array();
		foreach ( is_array( $atts ) ? $atts : array() as $key => $value ) {
			if ( is_int( $key ) ) {
				list( $key, $value ) = array( $value, 'true' );
			}
			$name = isset( $names[ self::key( $key ) ] ) ? $names[ self::key( $key ) ] : '';
			$kind = $name && isset( $type->attributes[ $name ]['type'] ) ? $type->attributes[ $name ]['type'] : '';
			$bool = filter_var( $value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
			if ( 'boolean' === $kind && null !== $bool ) {
				$options[ $name ] = $bool;
			} elseif ( 'number' === $kind && is_numeric( $value ) && self::fits( $name, $value ) ) {
				$options[ $name ] = $value + 0;
			} elseif ( 'string' === $kind && self::fits( $name, (string) $value ) ) {
				$options[ $name ] = (string) $value;
			} elseif ( 'id' !== $key ) {
				$wrong[] = $name ? $key . '=' . $value : $key;
			}
		}
		return array( $options, $wrong );
	}

	// a value the block keeps, checked as Block::data() checks it: one it would drop is left out with a note, and
	// the scan keeps its own (not the plugin's default); an empty height or color asks for the default
	private static function fits( $name, $value ) {
		$data = array( $name => $value );
		if ( isset( self::CHOICES[ $name ] ) ) {
			return in_array( $value, self::CHOICES[ $name ], true );
		}
		if ( in_array( $name, array( 'height', 'mobileHeight' ), true ) ) {
			return '' === $value || '' !== Block::height( $data, $name );
		}
		if ( 'hotspotColor' === $name ) {
			return '' === $value || '' !== Block::color( $data, $name );
		}
		if ( 'background' === $name ) {
			return in_array( $value, Block::BACKS, true ) || '' !== Block::color( $data, $name );
		}
		if ( 'radius' === $name ) {
			return null !== Block::num( $data, $name, 0, 100 );
		}
		return true;
	}

	private static function key( $name ) {
		return strtolower( str_replace( array( '_', '-' ), '', (string) $name ) );
	}

	// the All Scans list shows each scan's shortcode; a click copies it
	public function columns( $columns ) {
		$date = isset( $columns['date'] ) ? array( 'date' => $columns['date'] ) : array();
		unset( $columns['date'] );
		return $columns + array( 'alsv_shortcode' => __( 'Shortcode', 'softicon-splat-viewer' ) ) + $date;
	}

	public function column( $column, $id ) {
		if ( 'alsv_shortcode' === $column ) {
			printf( '<input type="text" class="alsv-shortcode" readonly value="%s" aria-label="%s" title="%s">', esc_attr( '[' . self::TAG . ' id="' . $id . '"]' ), esc_attr__( 'Shortcode', 'softicon-splat-viewer' ), esc_attr__( 'Click to copy', 'softicon-splat-viewer' ) );
		}
	}

	public function copy_script( $hook ) {
		$screen = get_current_screen();
		if ( 'edit.php' !== $hook || ! $screen || self::TYPE !== $screen->post_type ) {
			return;
		}
		wp_add_inline_style( 'common', '.column-alsv_shortcode input{width:100%;max-width:260px;font-family:Menlo,Consolas,monospace;font-size:12px;cursor:copy}' );
		wp_add_inline_script( 'common', 'document.addEventListener("click",function(e){var i=e.target.closest&&e.target.closest(".alsv-shortcode");if(!i){return;}i.select();var done=function(){i.title=' . wp_json_encode( __( 'Copied', 'softicon-splat-viewer' ) ) . ';};if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(i.value).then(done);}else if(document.execCommand("copy")){done();}});' );
	}
}
