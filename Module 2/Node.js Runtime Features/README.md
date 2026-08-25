# Node Runtime Features — Streams Assignment

Read the same file two ways and explain the difference.

## Run

```bash
npm start
```

## What to do

Open `index.js` and complete the three TODO sections:

1. `readWholeFile()` — read `sample-data.txt` with `fs.readFile` and log its size in **bytes** (from the Buffer's `.length`).
2. `streamFile()` — `fs.createReadStream(INPUT).pipe(fs.createWriteStream(OUTPUT))` to copy the file in chunks; log on the `finish` event.
3. PART 3 comment — explain, in your own words, why streaming beats `readFile` for large files (memory: whole file vs chunks).

See `question.md` for the full brief and submission details. Submit your **PR link**.

## Note

`sample-data.txt` is included for you. Running the script also creates `sample-copy.txt` — that is expected.
