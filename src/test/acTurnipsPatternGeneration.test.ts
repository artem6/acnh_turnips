// [...document.querySelectorAll('.ACTION-select')].map(o=>o.title || o.innerText).map(o=>o.match(/[\?\&]prices=([^&]+)/) || o.match(/[\?\&]p=([^&]+)/)).filter(Boolean).map(i=>i[1]).join('\n')
import fs from "fs";
import { possiblePatterns } from "../turnipCalculator";
import { acTurnipsPredict } from "../otherPatterns/acTurnipsPatterns";

const randint = (low: number, high: number) =>
  Math.floor(Math.random() * (high - low + 1)) + low;

test.skip("make sure turnip prophet patterns are identifiable", () => {
  const basePrice = 100;

  const curPrice = [basePrice, basePrice];
  let patternType = 0;
  for (let day = 2; day < 14; day++) {
    const patterns = acTurnipsPredict(curPrice);
    let dailyMin = 9999;
    let dailyMax = 0;
    patterns.forEach((patterns2, type) => {
      patterns2.forEach((pattern) => {
        dailyMin = Math.min(dailyMin, pattern.daily[day][0]);
        dailyMax = Math.max(dailyMax, pattern.daily[day][1]);
      });
      patternType = type;
    });
    curPrice.push(randint(dailyMin, dailyMax));
  }
  const prediction = possiblePatterns(curPrice);

  if (!prediction.patterns.length) {
    console.log(`================ ${patternType} ?prices=[${curPrice}]`);
  }
});
