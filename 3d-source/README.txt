GASMAX 3D scene — drop-in for your website

Files:
  index.html        the scene page (rename/embed as you like)
  three-d-stage.js  the viewer (lighting, orbit controls, export toolbar)

Embed on a site:
  1. Upload both files to the same folder on your server.
  2. Either link to index.html, or embed it:
       <iframe src="/gasmax-3d/index.html" style="width:100%;height:600px;border:0"></iframe>
  3. three.js loads from unpkg (pinned in the <script type="importmap"> block) — keep that block as-is.

Options (on the <three-d-stage> tag in index.html):
  autorotate       remove to stop the turntable
  background="…"   CSS color behind the scene

To get a model file instead (for Blender / other viewers), open the page and use the
toolbar to download OBJ+MTL or GLB.
