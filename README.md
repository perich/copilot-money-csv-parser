# copilot-money-csv-parser

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run main.ts
```

This project was created using `bun init` in bun v1.1.42. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


## What is this?

I use [Copilot Money](https://copilot.money/) to track my family's spending. They offer a .csv export feature. This script is intended to ingest the exported .csv and output a JSON file with rolled up annual expenses data. You can use it to get a year-end summary of all your spending. I made this as part of a larger project where I'm building an interactive [Sankey diagram](https://en.wikipedia.org/wiki/Sankey_diagram) to visualize my spending. Will post a full blog on [grahamperich.com](https://grahamperich.com) when I'm done. 