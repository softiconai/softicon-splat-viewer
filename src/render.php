<?php
use ALSV_Splat_Viewer\Block;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$alsv_scan = Block::data( $attributes );
if ( ! $alsv_scan ) {
	return;
}

$alsv_poster  = $alsv_scan['poster'];
$alsv_look    = $alsv_scan['look'];
// the look as CSS variables and a class (style.scss); every value is checked in Block::look(). Same in Edit.js
$alsv_style = '--alsv-radius:' . (float) $alsv_look['radius'] . 'px;';
foreach ( array( 'height' => '--alsv-height', 'mobileHeight' => '--alsv-height-m', 'hotspotColor' => '--alsv-spot' ) as $alsv_key => $alsv_var ) {
	if ( '' !== $alsv_look[ $alsv_key ] ) {
		$alsv_style .= $alsv_var . ':' . $alsv_look[ $alsv_key ] . ';';
	}
}
$alsv_class = 'alsv_viewer';
if ( '#' === $alsv_look['background'][0] ) {
	$alsv_style .= '--alsv-bg:' . $alsv_look['background'] . ';';
} elseif ( 'dark' !== $alsv_look['background'] ) {
	$alsv_class .= ' alsv_bg_' . $alsv_look['background'];
}
$alsv_wrapper = get_block_wrapper_attributes(
	array(
		'class'     => $alsv_class,
		'style'     => $alsv_style,
		'data-alsv' => wp_json_encode( Block::config( $attributes, $alsv_scan ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ),
	)
);
// WordPress picks lazy or eager loading itself: a poster at the top of a product page loads first
$alsv_image   = array(
	'class'    => 'alsv_poster',
	'decoding' => 'async',
);
// without a description of its own, the image's alt text from the Media Library
if ( '' !== $alsv_poster['alt'] ) {
	$alsv_image['alt'] = $alsv_poster['alt'];
}
// the poster, for search engines and visitors without JavaScript or WebGL2; the viewer takes its place
// by its id only when it is the image the block names, so an id alone shows no other file
$alsv_img = $alsv_poster['id'] && wp_attachment_is_image( $alsv_poster['id'] ) && wp_get_attachment_url( $alsv_poster['id'] ) === $alsv_poster['url']
	? wp_get_attachment_image( $alsv_poster['id'], 'full', false, $alsv_image )
	: '';
?>
<div <?php echo $alsv_wrapper; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<div class="alsv_stage">
		<?php if ( $alsv_img ) : ?>
			<?php echo $alsv_img; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<?php elseif ( '' !== $alsv_poster['url'] ) : ?>
			<?php echo wp_img_tag_add_loading_optimization_attrs( '<img class="alsv_poster" src="' . esc_url( $alsv_poster['url'] ) . '" alt="' . esc_attr( $alsv_poster['alt'] ) . '" decoding="async">', 'the_content' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped just above ?>
		<?php endif; ?>
		<noscript><p class="alsv_note"><?php esc_html_e( 'Turn on JavaScript to see this 3D scan.', 'softicon-splat-viewer' ); ?></p></noscript>
	</div>
</div>
