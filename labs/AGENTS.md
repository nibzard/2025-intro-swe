## Pandoc za konverziju MD → PDF

Za brzu konverziju Markdown datoteka u PDF:

```bash
# Osnovna konverzija
pandoc lab1.md -o lab1.pdf

# S boljom tipografijom
pandoc lab1.md -o lab1.pdf --pdf-engine=xelatex -V geometry:margin=1in

# Sa syntax highlighting za kod blokove
pandoc ime-datoteke.md -o ime-datoteke.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  --highlight-style=tango
```
