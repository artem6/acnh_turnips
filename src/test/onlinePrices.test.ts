// [...document.querySelectorAll('.ACTION-select')].map(o=>o.title || o.innerText).map(o=>o.match(/[\?\&]prices=([^&]+)/) || o.match(/[\?\&]p=([^&]+)/)).filter(Boolean).map(i=>i[1]).join('\n')
import fs from "fs";
import { possiblePatterns } from "../turnipCalculator";

const folder = new URL("onlinePrices/", import.meta.url).pathname;
const files = fs.readdirSync(folder);
const data: string[] = [];
files.forEach((file) => {
  if (file.match(/\.txt$/)) {
    data.push(
      ...fs
        .readFileSync(folder + file)
        .toString()
        .split("\n")
    );
  }
});

const dups: { [prices: string]: boolean } = {};

test("run all online prices through the calculator to make sure its working", () => {
  let total = 0;
  let missed = 0;
  data.forEach((row) => {
    try {
      if (!row) return;
      if (dups[row]) return;
      dups[row] = true;
      const strPrices: string[] = JSON.parse(row);
      const prices = strPrices.map((p) => parseInt(p));
      const lastPattern = prices.shift();
      prices.unshift(prices[0]);

      // remove out of bounds values
      if (prices[0] > 110 || prices[0] < 90) return;
      if (Math.min(...prices.filter(Boolean)) < 9) return;
      if (Math.max(...prices.filter(Boolean)) > 660) return;

      const prediction = possiblePatterns(prices, lastPattern);

      total++;
      if (!prediction.patterns.length || prediction.maxMistakes > 0) {
        missed++;
        console.log(
          `================ ?prices=${row}`,
          lastPattern,
          prices,
          prediction.maxMistakes
        );
      }
    } catch (e) {
      console.log(`================ ?prices=${row}`);
    }
  });
  console.log(`====== missed ${missed} of ${total} `);
});
