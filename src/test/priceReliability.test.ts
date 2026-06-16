/*
let prices = {};
[...document.querySelectorAll('.ACTION-select')].map(o=>o.title || o.innerText).map(o=>o.match(/[\?\&]prices=([^&]+)/) || o.match(/[\?\&]p=([^&]+)/)).filter(Boolean).map(i=>i[1]).map(a=> { try { return Math.max(...JSON.parse(a)) } catch(e) { return null }}).forEach(p => { prices[p] = prices[p] || 0; prices[p]++})
Object.keys(prices).map(p=>`${p},${prices[p]}`).join('\n')
*/

// TODO find similar patterns as mistake price, it might be the user messing around e.g. 5,100,200 --> 5,100,400
//    - subtract one day in same day to find similar

// todo - how common is each pattern given last week's pattern
// todo - how many people continue after the max
// todo - how many people continue after perfect prediction

import fs from "fs";
import { Pattern, possiblePatterns } from "../turnipCalculator";

interface Price {
  url: string;
  lastPattern: number;
  prices: number[];
  extended?: boolean; // are there more prices in this list from a diff entry?
  crossDayExtensionCount: number;
  stemming: string[]; // similar patterns, in case user is messing about
  prediction?: {
    patterns: Pattern[];
    maxMistakes: number;
  };
}

// prices logged
interface PriceMap {
  [price: string]: Price;
}

// prices logged across days
interface DayMap {
  [day: string]: PriceMap;
}

// rooting of a price list for finding new prices added to this list
interface RootMap {
  [root: string]: string[];
}

// read the raw data
const folder = new URL("onlinePrices/", import.meta.url).pathname;
const files = fs.readdirSync(folder);
const data: { [day: string]: string[] } = {};
files.forEach((file, idx) => {
  // if (idx > 0) return; // temporary for testing
  let curDay: string[] = [];
  data[file] = curDay;
  if (file.match(/\.txt$/)) {
    curDay.push(
      ...fs
        .readFileSync(folder + file)
        .toString()
        .split("\n")
    );
  }
});

// create an indexed price map
const dayMap: DayMap = {};
Object.keys(data).forEach((day) => {
  dayMap[day] = {};
  data[day].forEach((strPrices) => {
    try {
      const prices: number[] = JSON.parse(strPrices).map((p: any) => p || 0);
      const key = prices.map((a) => (!a ? "" : a)).join(",");

      const lastPattern = prices.shift() as number;
      prices.unshift(prices[0]);

      // remove out of bounds values
      if (prices[0] > 110 || prices[0] < 90) return;
      if (Math.min(...prices.filter(Boolean)) < 9) return;
      if (Math.max(...prices.filter(Boolean)) > 660) return;

      dayMap[day][key] = {
        url: `?prices=${strPrices}`,
        lastPattern,
        prices,
        stemming: [],
        crossDayExtensionCount: 0,
      };
    } catch (e) {}
  });
});

const dailyRootMap: { [day: string]: RootMap } = {};

// mark extensions in the same day
Object.keys(dayMap).forEach((day) => {
  const curDay = dayMap[day];

  // build a root map
  const rootMap: RootMap = {};
  const stemMap: RootMap = {};
  Object.keys(curDay).forEach((priceKey) => {
    // one day stem
    const rawP = priceKey.split(",");
    rawP.pop();
    const stemKey = rawP.join(",");
    stemMap[stemKey] = stemMap[stemKey] || [];
    stemMap[stemKey].push(priceKey);
    curDay[priceKey].stemming = stemMap[stemKey];

    // roots
    for (let i = 0; i < priceKey.length; i++) {
      const rootKey = priceKey.substr(0, i);
      rootMap[rootKey] = rootMap[rootKey] || [];
      rootMap[rootKey].push(priceKey);
    }
  });

  dailyRootMap[day] = rootMap;

  // mark extended from the root map in the same day
  Object.keys(curDay).forEach((priceKey) => {
    // extensions
    if (rootMap[priceKey]) {
      if (rootMap[priceKey].indexOf(priceKey) === -1) {
        curDay[priceKey].extended = true;
      }
    }
  });
});

// track extensions across days
Object.keys(dayMap).forEach((day, idx) => {
  const curDay = dayMap[day];
  const curRootMap = dailyRootMap[day];

  // for each priceKey in the cur day, check when it is next extended
  Object.keys(curDay).forEach((priceKey) => {
    Object.keys(dayMap).forEach((dayFuture, idxFuture) => {
      if (idxFuture <= idx) return;

      const futureDay = dayMap[dayFuture];
      const futureRootMap = dailyRootMap[dayFuture];

      // it was FIRST extended in a future day
      const futureDayExtensions = futureRootMap[priceKey];
      if (futureDayExtensions) {
        // extended in future
        futureDayExtensions.forEach((futurePriceKey) => {
          // that future extension is not in the current day
          if (curRootMap[futurePriceKey]) return;

          // this is a valid extension
          curDay[priceKey].extended = true;
          futureDay[futurePriceKey].crossDayExtensionCount = Math.max(
            futureDay[futurePriceKey].crossDayExtensionCount,
            curDay[priceKey].crossDayExtensionCount + 1
          );
        });
      }
    });
  });
});

// log the results
let total = 0;
let finalExtension = 0;
let extensionCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const finalPrices: Price[] = [];
Object.keys(dayMap).forEach((day, idx) => {
  const curDay = dayMap[day];

  // for each priceKey in the cur day, check when it is next extended
  Object.keys(curDay).forEach((priceKey) => {
    if (!curDay[priceKey].extended) {
      finalExtension++;
      extensionCount[curDay[priceKey].crossDayExtensionCount]++;
      finalPrices.push(curDay[priceKey]);
    }
    total++;
  });
  console.log(finalExtension, total, extensionCount);
});

// gather predictions for these prices
finalPrices.forEach((price) => {
  price.prediction = possiblePatterns(price.prices, price.lastPattern);
});

// show how reliable the prices really are
const mistakeWithStemmingByReliability = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const mistakesByReliability = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const totalByReliability = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
finalPrices.forEach((price) => {
  if (!price.prediction) return;
  if (!price.prediction.patterns.length || price.prediction.maxMistakes > 0) {
    if (price.stemming.length > 1) {
      mistakeWithStemmingByReliability[price.crossDayExtensionCount]++;
    } else {
      mistakesByReliability[price.crossDayExtensionCount]++;
    }

    // if (price.crossDayExtensionCount === 6) {
    //   console.log(price);
    // }
  }
  totalByReliability[price.crossDayExtensionCount]++;
});

console.log(mistakeWithStemmingByReliability);
console.log(mistakesByReliability);
console.log(totalByReliability);

for (let i = 0; i < 10; i++) {
  console.log(mistakesByReliability[i] / totalByReliability[i]);
}

test("test", () => {
  // test
  // console.log(priceMap);
});
