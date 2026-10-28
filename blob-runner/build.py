"""Build offline HTML outputs from maintainable source; no dependencies."""
from pathlib import Path
import base64
root=Path(__file__).parent
src=root/'src'
shell=(src/'shell.html').read_text()
source=shell.replace('href="styles.css"','href="src/styles.css"').replace('src="model.js"','src="src/model.js"').replace('src="game.js"','src="src/game.js"').replace('src="art.js"','src="src/art.js"').replace('src="boss.js"','src="src/boss.js"')
(root/'index.html').write_text(source)
# Modular source resolves the sprite relative to the page, without embedded duplication.
(src/'boss-runtime.js').write_text((src/'boss.js').read_text().replace('__BOSS_SPRITE__','assets/boss.png'))
(root/'index.html').write_text(source.replace('src/boss.js','src/boss-runtime.js'))
standalone=shell.replace('<link rel="stylesheet" href="styles.css">','<style>\n'+(src/'styles.css').read_text()+'\n</style>')
for name in ['model','art','boss','game']:
 standalone=standalone.replace(f'<script src="{name}.js"></script>','<script>\n'+(src/f'{name}.js').read_text().replace('__BOSS_SPRITE__','data:image/png;base64,'+base64.b64encode((root/'assets/boss.png').read_bytes()).decode())+'\n</script>')
(root/'Blob_Runner.html').write_text(standalone)
print('Built index.html and Blob_Runner.html')
