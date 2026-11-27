=== SoftIcon Splat Viewer ===
Contributors: softiconai
Tags: gaussian splatting, 3d scan, splat, 3d viewer, block
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Show your 3D scans (Gaussian splats) on WordPress. Set the view, the camera and hotspots right in the block editor. No external services.

== Description ==

**SoftIcon Splat Viewer** adds a **Splat Viewer** block to the block editor. Scan an object or a room with a phone app such as Scaniverse, Polycam or Luma, upload the Gaussian splat file, and visitors can turn it, zoom in and walk through it, right on your page.

Made for shops with one-of-a-kind products (handmade pieces, ceramics, furniture, plants, art), 3D scan services, museums and heritage sites, hotels, venues and restaurants, real estate and architects.

* **Set it up in the block editor** – the block shows the real 3D scan while you edit. Turn it upright, set the starting view and place hotspots by clicking on the scan.
* **Gaussian splat files** – .spz, .ply, .splat, .ksplat and .sog, uploaded to your Media Library or from any web address.
* **Turn it upright** – many scans arrive upside down or on their side. Flip them, turn them in 90° steps or with sliders, size them and center them in one click.
* **Orbit or walk** – go around an object, or walk inside a room: drag to look around, W A S D or the arrow keys to walk, two fingers on a phone.
* **Your starting view** – turn and zoom the scan, then press **Use the current view**. Visitors start there. Or let the block frame the whole scan for you.
* **Hotspots** – click on the scan to place one, drag it to move it. An info hotspot opens a card with a title, text and an image; a link hotspot opens any page, such as "Book now" or "Add to cart". Up to 50 per scan. Hotspots behind the scan fade out.
* **Turn on its own** – the scan turns slowly, at your speed, until the visitor takes over. It stays still for visitors who ask their device for less motion.
* **Poster** – capture the current view as an image for the Media Library, or choose your own. It shows until the scan has loaded, to visitors whose browser cannot show 3D, and to search engines.
* **Load on click** – the page shows the poster with a "View in 3D" button, and nothing of the scan loads before it is pressed. Good for big files, long pages and phones.
* **Buttons for visitors** – back to the start view, show or hide the hotspots, turn on its own, walk inside, full screen. You pick which ones show.
* **Your look** – height in pixels or as a share of the screen, its own height on phones, rounded corners, a dark, light, transparent or own-color background, and the hotspots' color.
* **Quality** – Auto draws a little softer on phones so the scan turns smoothly; or always High, or always Low.
* **Shortcode** – **3D Scans → Add a scan** holds a scan with all its settings, and `[softicon_splat id="123"]` shows it in a WooCommerce product description, the Classic Editor, Elementor or any page builder. Change a setting for one place, such as `[softicon_splat id="123" height="600" load="click"]`.
* **Accessible** – a description for screen readers, keyboard control (arrow keys to turn, + and - to zoom), hotspots you can reach with the Tab key and cards that close with Esc, and buttons that say whether they are on.
* **Fast** – nothing loads until the scan comes near the screen (or is clicked), and the 3D viewer loads only on pages that have a scan.
* **No external services** – the viewer and your Media Library files are on your site. No API key, no CDN, no account, no cookies, no tracking.

= Privacy =

The plugin sets no cookies, stores nothing about visitors and connects to no outside service. The block's settings are saved in the block, inside your post. A scan, poster or hotspot image you add by the address of another website is loaded by visitors' browsers from that website.

= Third-party libraries =

* Spark 2.4.0 (npm package @sparkjsdev/spark) by World Labs – [sparkjs.dev](https://sparkjs.dev/) / [github.com/sparkjsdev/spark](https://github.com/sparkjsdev/spark) – MIT License. Draws the Gaussian splats. Bundled in build/spark.js; license in build/spark-LICENSE.txt. It runs fully in the browser and loads nothing from outside the site.
* fflate 0.8 by Arjun Barrett – [github.com/101arrowz/fflate](https://github.com/101arrowz/fflate) – MIT License. Unzips scan files; it is part of Spark's own file (build/spark.js). License in build/fflate-LICENSE.txt.
* three.js 0.180.0 (npm package three) – [threejs.org](https://threejs.org/) / [github.com/mrdoob/three.js](https://github.com/mrdoob/three.js) – MIT License. The 3D scene and camera controls. Bundled in build/three.js; license in build/three-LICENSE.txt.

= Source code =

The plugin's source is in the src folder of the plugin, and builds with `npm ci` (package-lock.json) and `npm run build`. It is also on GitHub: [github.com/softiconai/softicon-splat-viewer](https://github.com/softiconai/softicon-splat-viewer).

build/spark.js is Spark's own distribution file (dist/spark.module.js of @sparkjsdev/spark 2.4.0). It contains a WebAssembly module, embedded as base64, compiled from Spark's Rust source in the rust/spark-rs folder of [github.com/sparkjsdev/spark](https://github.com/sparkjsdev/spark) (version 2.4.0), and Spark's web worker (src/worker.ts in the same repository), embedded as text. Both run in the visitor's browser only.

== Installation ==

1. Install the plugin from **Plugins → Add New**, or upload the zip, and activate it.
2. In the block editor, add the **Splat Viewer** block.
3. Upload a 3D scan file, or choose one from the Media Library.
4. Turn it upright in **Orientation** if needed, set the start view in **Camera**, and add hotspots in **Hotspots**.

For the Classic Editor, WooCommerce product descriptions or a page builder: go to **3D Scans → Add a scan**, set it up the same way, publish it and copy its shortcode from the **All Scans** list.

== Frequently Asked Questions ==

= Which files can I use? =

Gaussian splat files: .spz, .ply, .splat, .ksplat and .sog. A .spz file is the smallest and loads fastest: it is usually about ten times smaller than a .ply file. The plugin lets people who can upload files add these types to the Media Library, and checks that each file really is one.

= Which apps make these files? =

Phone apps such as Scaniverse, Polycam and Luma, and desktop tools such as Postshot. Export the scan as a Gaussian splat (.spz or .ply).

= My scan is upside down. =

That is common. Open **Orientation** and press **Flip upside down**, or turn it in 90° steps until it stands upright.

= How big can a scan be? =

The block warns you above 20 MB and offers **Load on click**, so the file loads only for visitors who ask for it. Phone scans saved as .spz are often only a few MB.

= Does it work on phones? =

Yes. Drag with a finger to turn, pinch to zoom, two fingers to walk forward in Walk mode. The browser needs WebGL 2, which current phones and computers have; without it, visitors see the poster and a short note.

= Can I show the scan in a WooCommerce product? =

Yes. Make the scan under **3D Scans**, then paste its shortcode into the product description.

= Does it connect to any outside service? =

No. The plugin itself connects to nothing, and the viewer is on your site. If you paste a file or image address from another website, visitors' browsers load that file from there.

== Changelog ==

= 1.0.0 =
* First release.
