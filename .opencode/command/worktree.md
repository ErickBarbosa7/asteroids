---
description: Crea un nuevo worktree git en .worktree/<nombre> a partir del contexto dado.
agent: build
---

Solo vas a hacer UNA cosa, nada más.

Convierte $ARGUMENTS en un slug que sea el nombre del worktree:
- Baja a minúsculas, quita tildes y caracteres especiales.
- Los espacios y separadores se reemplazan por guiones (`-`, kebab-case).
- Debe quedar un único slug (ej. "cambiar power-ups" -> "cambiar-power-ups").
- Si no hay argumento, deriva el nombre del contexto de la conversación.
- Revisa `git worktree list` antes solo para confirmar que no exista ya, y si existe, termina sin hacer nada.

Luego ejecuta exactamente UNA vez este comando desde la raíz del repo:

git worktree add .worktree/<nombre>

No cambies de directorio. No crees, edites ni borres otros archivos. No hagas commits, stashes ni ningún otro comando git. Cuando termine, confírmalo con un mensaje corto.

Si el argumento es muy largo simplificalo a un nombre significativo