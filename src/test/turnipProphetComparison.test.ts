// [...document.querySelectorAll('.ACTION-select')].map(o=>o.title || o.innerText).map(o=>o.match(/[\?\&]prices=([^&]+)/) || o.match(/[\?\&]p=([^&]+)/)).filter(Boolean).map(i=>i[1]).join('\n')
import fs from "fs";
import { possiblePatterns } from "../turnipCalculator";
import { turnipProphetPredict } from "../otherPatterns/turnipProphetPatterns";

const randint = (low: number, high: number) =>
  Math.floor(Math.random() * (high - low + 1)) + low;

test("make sure turnip prophet patterns are identifiable", () => {
  for (let basePrice = 90; basePrice <= 110; basePrice++) {
    const patterns = turnipProphetPredict(basePrice);
    patterns.forEach((patterns2, type) => {
      patterns2.forEach((pattern) => {
        for (let i = 0; i < 1; i++) {
          let prices = [basePrice, basePrice];
          pattern.daily.forEach((day, dayNo) => {
            if (dayNo < 2) return;
            prices.push(randint(day[0], day[1]));
          });
          const prediction = possiblePatterns(prices);

          if (!prediction.patterns.length) {
            console.log(`================ ${type} ?prices=[${prices}]`);
            console.log(pattern.daily);
          }
        }
      });
    });
  }
});
