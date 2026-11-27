<?php
/**
 * Plugin Name: SoftIcon Splat Viewer
 * Description: Show your 3D scans (Gaussian splats) on WordPress. Set the view, the camera and hotspots right in the block editor. No external services.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author: softiconai
 * Author URI: https://profiles.wordpress.org/softiconai/
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: softicon-splat-viewer
 * Domain Path: /languages
 *
 * @package SoftIcon_Splat_Viewer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ALSV_PLUGIN_VERSION', '1.0.0' );
define( 'ALSV_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );

require_once ALSV_PLUGIN_PATH . 'includes/class-block.php';
require_once ALSV_PLUGIN_PATH . 'includes/class-mimes.php';
require_once ALSV_PLUGIN_PATH . 'includes/class-shortcode.php';
new ALSV_Splat_Viewer\Block();
new ALSV_Splat_Viewer\Mimes();
new ALSV_Splat_Viewer\Shortcode();

// add-ons hook in here, once every plugin is loaded
add_action(
	'plugins_loaded',
	function () {
		do_action( 'alsv_loaded' );
	}
);
