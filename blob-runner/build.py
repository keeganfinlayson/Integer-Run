"""Build offline HTML outputs from maintainable source; no dependencies."""
from pathlib import Path
root=Path(__file__).parent
src=root/'src'
shell=(src/'shell.html').read_text()
source=shell.replace('href="styles.css"','href="src/styles.css"').replace('src="model.js"','src="src/model.js"').replace('src="game.js"','src="src/game.js"').replace('src="art.js"','src="src/art.js"')
(root/'index.html').write_text(source)
standalone=shell.replace('<link rel="stylesheet" href="styles.css">','<style>\n'+(src/'styles.css').read_text()+'\n</style>')
for name in ['model','art','game']:
 standalone=standalone.replace(f'<script src="{name}.js"></script>','<script>\n'+(src/f'{name}.js').read_text()+'\n</script>')
(root/'Blob_Runner.html').write_text(standalone)
print('Built index.html and Blob_Runner.html')
