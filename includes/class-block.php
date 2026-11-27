<?php
namespace ALSV_Splat_Viewer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// the same rules are in src/utils/data.js
class Block {

	const NAME     = 'softicon/splat-viewer';
	const FORMATS  = array( 'spz', 'ply', 'splat', 'ksplat', 'sog' );
	const HOTSPOTS = 50;
	const TYPES    = array( 'info', 'link' );
	const MODES    = array( 'orbit', 'walk' );
	const LOADS    = array( 'visible', 'click' );
	const QUALITY  = array( 'auto', 'high', 'low' );
	const BACKS    = array( 'dark', 'light', 'transparent' );
	const FAR      = 10000;

	public function __construct() {
		add_action( 'init', array( $this, 'register' ) );
		add_filter( 'block_editor_settings_all', array( $this, 'editor_settings' ) );
		add_action( 'enqueue_block_assets', array( $this, 'editor_viewer' ) );
	}

	public function register() {
		register_block_type( ALSV_PLUGIN_PATH . 'build' );
	}

	// no Settings/Styles tabs; the site's viewer config for the editor
	public function editor_settings( $settings ) {
		$tabs                           = isset( $settings['blockInspectorTabs'] ) && is_array( $settings['blockInspectorTabs'] ) ? $settings['blockInspectorTabs'] : array();
		$tabs[ self::NAME ]             = false;
		$settings['blockInspectorTabs'] = $tabs;
		$settings['alsv']               = self::config( array() );
		return $settings;
	}

	// the editor's viewer: view.js in the editor iframe, where WebGL and pointer events work
	public function editor_viewer() {
		if ( is_admin() ) {
			wp_enqueue_script( 'softicon-splat-viewer-view-script' );
		}
	}

	public static function text( $data, $key ) {
		return is_array( $data ) && isset( $data[ $key ] ) && is_scalar( $data[ $key ] ) ? trim( (string) $data[ $key ] ) : '';
	}

	// sanitize_text_field() turns a lone < into &lt;
	public static function plain( $value, $max ) {
		return mb_substr( str_replace( '&lt;', '<', $value ), 0, $max );
	}

	public static function line( $data, $key, $max ) {
		return self::plain( sanitize_text_field( self::text( $data, $key ) ), $max );
	}

	public static function id( $data, $key ) {
		return substr( sanitize_key( self::text( $data, $key ) ), 0, 40 );
	}

	// a number in min..max, or null
	public static function num( $data, $key, $min, $max ) {
		$value = is_array( $data ) && isset( $data[ $key ] ) && is_numeric( $data[ $key ] ) && ! is_bool( $data[ $key ] ) ? (float) $data[ $key ] : INF;
		return $value >= $min && $value <= $max ? round( $value, 3 ) : null;
	}

	public static function flag( $data, $key, $fallback ) {
		return is_array( $data ) && isset( $data[ $key ] ) && is_bool( $data[ $key ] ) ? $data[ $key ] : $fallback;
	}

	public static function pick( $data, $key, $list ) {
		$value = self::text( $data, $key );
		return in_array( $value, $list, true ) ? $value : $list[0];
	}

	// three numbers, or null
	public static function vec( $data, $key ) {
		$list = is_array( $data ) && isset( $data[ $key ] ) && is_array( $data[ $key ] ) ? array_values( $data[ $key ] ) : array();
		if ( 3 !== count( $list ) ) {
			return null;
		}
		$vec = array( self::num( $list, 0, -self::FAR, self::FAR ), self::num( $list, 1, -self::FAR, self::FAR ), self::num( $list, 2, -self::FAR, self::FAR ) );
		return in_array( null, $vec, true ) ? null : $vec;
	}

	// an address with a host, or one on this site
	public static function link( $value ) {
		$url = esc_url_raw( $value, array( 'http', 'https' ) );
		return preg_match( '#^([/?\#]|https?://[^/?\#]+)#', $url ) ? $url : '';
	}

	// the format from the file's name when none is given: x.ply, x.compressed.ply
	public static function format( $raw, $url ) {
		$format = strtolower( self::text( $raw, 'format' ) );
		if ( ! in_array( $format, self::FORMATS, true ) ) {
			$format = strtolower( pathinfo( (string) wp_parse_url( $url, PHP_URL_PATH ), PATHINFO_EXTENSION ) );
		}
		return in_array( $format, self::FORMATS, true ) ? $format : '';
	}

	// null without a usable file
	public static function file( $raw ) {
		$url    = self::link( self::text( $raw, 'url' ) );
		$format = '' !== $url ? self::format( $raw, $url ) : '';
		if ( '' === $format ) {
			return null;
		}
		return array(
			'id'     => isset( $raw['id'] ) && is_scalar( $raw['id'] ) ? absint( $raw['id'] ) : 0,
			'url'    => $url,
			'format' => $format,
		);
	}

	public static function transform( $raw ) {
		$scale = self::num( $raw, 'scale', 0.001, 1000 );
		return array(
			'rotX'   => (float) self::num( $raw, 'rotX', -180, 180 ),
			'rotY'   => (float) self::num( $raw, 'rotY', -180, 180 ),
			'rotZ'   => (float) self::num( $raw, 'rotZ', -180, 180 ),
			'scale'  => null === $scale ? 1.0 : $scale,
			'offset' => self::vec( $raw, 'offset' ) ?? array( 0.0, 0.0, 0.0 ),
		);
	}

	// no position or target: the viewer frames the scan itself
	public static function camera( $raw ) {
		$fov   = self::num( $raw, 'fov', 20, 120 );
		$speed = self::num( $raw, 'speed', 0.1, 10 );
		return array(
			'mode'       => self::pick( $raw, 'mode', self::MODES ),
			'position'   => self::vec( $raw, 'position' ),
			'target'     => self::vec( $raw, 'target' ),
			'fov'        => null === $fov ? 50.0 : $fov,
			'autoRotate' => self::flag( $raw, 'autoRotate', false ),
			'speed'      => null === $speed ? 1.0 : $speed,
			'zoom'       => self::flag( $raw, 'zoom', true ),
		);
	}

	// null when the hotspot has no place, no type or nothing to show
	public static function hotspot( $raw, $index ) {
		$type     = self::text( $raw, 'type' );
		$position = self::vec( $raw, 'position' );
		if ( ! in_array( $type, self::TYPES, true ) || null === $position ) {
			return null;
		}
		$id   = self::id( $raw, 'id' );
		$spot = array(
			'id'       => '' !== $id ? $id : 'h' . $index,
			'type'     => $type,
			'position' => $position,
			'title'    => self::line( $raw, 'title', 200 ),
			'text'     => self::plain( sanitize_textarea_field( self::text( $raw, 'text' ) ), 500 ),
			'imageId'  => isset( $raw['imageId'] ) && is_scalar( $raw['imageId'] ) ? absint( $raw['imageId'] ) : 0,
			'imageUrl' => self::link( self::text( $raw, 'imageUrl' ) ),
			'url'      => self::link( self::text( $raw, 'url' ) ),
		);
		$shows = 'link' === $type ? '' !== $spot['url'] : '' !== $spot['title'] . $spot['text'] . $spot['imageUrl'];
		return $shows ? $spot : null;
	}

	public static function hotspots( $list ) {
		$list  = is_array( $list ) ? array_slice( array_values( $list ), 0, self::HOTSPOTS ) : array();
		$spots = array();
		foreach ( $list as $index => $raw ) {
			$spot = self::hotspot( $raw, $index );
			if ( $spot && ! isset( $spots[ $spot['id'] ] ) ) {
				$spots[ $spot['id'] ] = $spot;
			}
		}
		return array_values( $spots );
	}

	public static function poster( $raw ) {
		$url = self::link( self::text( $raw, 'url' ) );
		return array(
			'id'  => '' !== $url && isset( $raw['id'] ) && is_scalar( $raw['id'] ) ? absint( $raw['id'] ) : 0,
			'url' => $url,
			'alt' => self::line( $raw, 'alt', 300 ),
		);
	}

	// a CSS height: 480, 480px or 70vh; '' for the default
	public static function height( $data, $key ) {
		$value = strtolower( str_replace( ' ', '', self::text( $data, $key ) ) );
		if ( ! preg_match( '/^(\d{1,4})(px|vh)?$/', $value, $match ) ) {
			return '';
		}
		$number = (int) $match[1];
		$unit   = empty( $match[2] ) ? 'px' : $match[2];
		$fits   = 'px' === $unit ? $number >= 100 && $number <= 3000 : $number >= 10 && $number <= 100;
		return $fits ? $number . $unit : '';
	}

	// #abc or #aabbcc, in small letters; '' when it is no color
	public static function color( $data, $key ) {
		$value = strtolower( self::text( $data, $key ) );
		return preg_match( '/^#([0-9a-f]{3}|[0-9a-f]{6})$/', $value ) ? $value : '';
	}

	// how the viewer looks: its size, corners and colors, and how sharp it draws
	public static function look( $raw ) {
		$radius     = self::num( $raw, 'radius', 0, 100 );
		$background = self::text( $raw, 'background' );
		return array(
			'height'       => self::height( $raw, 'height' ),
			'mobileHeight' => self::height( $raw, 'mobileHeight' ),
			'radius'       => null === $radius ? 12.0 : $radius,
			'background'   => in_array( $background, self::BACKS, true ) ? $background : ( '' !== self::color( $raw, 'background' ) ? self::color( $raw, 'background' ) : 'dark' ),
			'hotspotColor' => self::color( $raw, 'hotspotColor' ),
			'quality'      => self::pick( $raw, 'quality', self::QUALITY ),
		);
	}

	// the visitor's buttons
	public static function toolbar( $raw ) {
		return array(
			'reset'      => self::flag( $raw, 'showReset', true ),
			'fullscreen' => self::flag( $raw, 'showFullscreen', true ),
			'hotspots'   => self::flag( $raw, 'showHotspotToggle', true ),
			'autoRotate' => self::flag( $raw, 'showAutoRotate', false ),
			'mode'       => self::flag( $raw, 'showModeSwitch', false ),
		);
	}

	// what the page shows, or null without a file
	public static function data( $attributes ) {
		$attributes = is_array( $attributes ) ? $attributes : array();
		$file       = self::file( isset( $attributes['file'] ) ? $attributes['file'] : null );
		if ( ! $file ) {
			return null;
		}
		$part = function ( $key ) use ( $attributes ) {
			return isset( $attributes[ $key ] ) && is_array( $attributes[ $key ] ) ? $attributes[ $key ] : array();
		};
		return array(
			'file'      => $file,
			'transform' => self::transform( $part( 'transform' ) ),
			'camera'    => self::camera( $part( 'camera' ) ),
			'hotspots'  => self::hotspots( isset( $attributes['hotspots'] ) ? $attributes['hotspots'] : array() ),
			'poster'    => self::poster( $part( 'poster' ) ),
			'loadMode'  => self::pick( $attributes, 'loadMode', self::LOADS ),
			'look'      => self::look( $attributes ),
			'toolbar'   => self::toolbar( $attributes ),
		);
	}

	// read by view.js
	public static function config( $attributes, $data = null ) {
		return apply_filters( 'alsv_config', array( 'scan' => $data ), $attributes );
	}
}
