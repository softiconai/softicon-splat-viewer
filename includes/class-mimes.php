<?php
namespace ALSV_Splat_Viewer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// lets people who can upload add splat files to the Media Library; nothing else changes
class Mimes {

	// extension => what PHP's file check may find inside (.spz is gzip, .sog is zip, .ply has a text header)
	const FILES = array(
		'spz'    => array( 'application/gzip', 'application/x-gzip', 'application/octet-stream' ),
		'ply'    => array( 'text/plain', 'application/octet-stream' ),
		'splat'  => array( 'application/octet-stream' ),
		'ksplat' => array( 'application/octet-stream' ),
		'sog'    => array( 'application/zip', 'application/octet-stream' ),
	);

	const TYPE = 'application/octet-stream';

	public function __construct() {
		add_filter( 'upload_mimes', array( $this, 'mimes' ), 10, 2 );
		add_filter( 'wp_check_filetype_and_ext', array( $this, 'check' ), 10, 5 );
	}

	// $user: a user or a user id (get_allowed_mime_types() passes either), or none for the current one
	public static function can_upload( $user = null ) {
		if ( is_numeric( $user ) ) {
			$user = get_userdata( (int) $user );
		}
		return $user instanceof \WP_User ? user_can( $user, 'upload_files' ) : current_user_can( 'upload_files' );
	}

	public function mimes( $mimes, $user = null ) {
		if ( self::can_upload( $user ) ) {
			foreach ( array_keys( self::FILES ) as $ext ) {
				$mimes[ $ext ] = self::TYPE;
			}
		}
		return $mimes;
	}

	// how each file starts: .ply has a text header, .spz is gzip, .sog is zip; .splat and .ksplat have no mark
	const MAGIC = array(
		'ply' => 'ply',
		'spz' => "\x1f\x8b",
		'sog' => "PK\x03\x04",
	);

	// WordPress compares the file's content with its extension; a splat file's content is one of FILES[ $ext ].
	// First, whatever WordPress found: a file that does not start like a splat file goes. Servers send these files
	// with no type, and a browser takes one that starts like a web page for one and runs its scripts on the site.
	public function check( $data, $file, $filename, $mimes, $real_mime = null ) {
		$ext = strtolower( pathinfo( (string) $filename, PATHINFO_EXTENSION ) );
		if ( ! isset( self::FILES[ $ext ] ) ) {
			return $data;
		}
		if ( ! self::looks_right( $file, $ext ) ) {
			$data['ext']  = false;
			$data['type'] = false;
			return $data;
		}
		if ( ! empty( $data['ext'] ) || ! self::can_upload() ) {
			return $data;
		}
		$allowed = is_array( $mimes ) ? $mimes : get_allowed_mime_types();
		if ( ! isset( $allowed[ $ext ] ) || ( $real_mime && ! in_array( $real_mime, self::FILES[ $ext ], true ) ) ) {
			return $data;
		}
		$data['ext']  = $ext;
		$data['type'] = self::TYPE;
		return $data;
	}

	// the file's first bytes: the format's own mark, or, without one, nothing a browser could read as HTML or XML
	// (after spaces, a < and then a letter, !, ? or /)
	public static function looks_right( $file, $ext ) {
		$head = is_string( $file ) && is_readable( $file ) ? (string) file_get_contents( $file, false, null, 0, 64 ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- the upload's own temporary file
		if ( isset( self::MAGIC[ $ext ] ) ) {
			return 0 === strpos( $head, self::MAGIC[ $ext ] );
		}
		return '' !== $head && ! preg_match( '#^[\t\n\f\r ]*<[a-z!?/]#i', $head );
	}
}
