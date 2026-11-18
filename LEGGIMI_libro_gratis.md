# Landing «Libro in regalo» (PDF)

Si aggiunge al repository GitHub che hai già (`dio-a-casa-bonus`). Non servono nuove variabili su Vercel:
usa lo stesso Google Sheet della landing del bonus. I lead arrivano nella scheda «Lead» con, nella colonna
«Libro», la dicitura «(PDF in regalo)».

## Cosa caricare su GitHub (Add file → Upload files)
1. La cartella `libro-gratis` (contiene `index.html`, la landing).
2. Il file `api/submit-libro.js` dentro la cartella `api` (accanto a `submit.js`).
3. La cartella `dono-libro-r7m4` con il PDF del libro (circa 9 MB).
4. Il file `vercel.json`, sostituendo quello esistente (aggiunge il «non indicizzare» per il PDF).

Vercel aggiorna il sito da solo.

## Indirizzo della landing
https://dio-a-casa-bonus.vercel.app/libro-gratis/

## Prova
Apri l'indirizzo, compila il modulo con un'email di prova: devono comparire i pulsanti «Scarica il libro in PDF»
e «Apri i 4 bonus», e sul Google Sheet la riga con «(PDF in regalo)».
