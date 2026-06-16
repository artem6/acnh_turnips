// https://gist.github.com/Treeki/85be14d297c80c8b3c0a76375743325b

import { i18n } from "./i18n/i18n";
// import { turnipProphetPredict } from "./otherPatterns/turnipProphetPatterns";
// import { acTurnipsPredict } from "./otherPatterns/acTurnipsPatterns";

const randbool = () => Math.random() > 0.5;
const randint = (low: number, high: number) =>
  Math.floor(Math.random() * (high - low + 1)) + low;
const intceil = (num: number) => Math.ceil(num);
const randfloat = (low: number, high: number) =>
  Math.random() * (high - low) + low;

export interface Pattern {
  dailyPriceRange: { low: number; high: number }[];
  probability: number;
  type: number; // 0|1|2|3;
  decreasingStart: number; // first day of a decreasing pattern
}

interface Grouping {
  type: number; // 0|1|2|3;
  probability: number;
  minPrice: number;
  maxPrice: number;
}

export const patternNames = () => [
  i18n("Fluctuating"),
  i18n("Large Spike"),
  i18n("Decreasing"),
  i18n("Small Spike"),
  i18n("Unknown"),
  i18n("First Time Buyer"),
];

export interface Prediction {
  daily: [number, number][];
  decreasingStart: number;
}

// 0.9 - 1.4 random
function pattern0(basePrice: number) {
  basePrice = basePrice || startPrice();
  let sellPrices = [basePrice, basePrice];
  // PATTERN 0: high, decreasing, high, decreasing, high
  let work = 2;

  const hiPhaseLen1 = randint(0, 6);
  const decPhaseLen1 = randint(2, 3); // DEVIATION was 2-3
  const hiPhaseLen2and3 = 7 - hiPhaseLen1;
  const decPhaseLen2 = 5 - decPhaseLen1;
  const hiPhaseLen3 = randint(0, hiPhaseLen2and3 - 1);

  // high phase 1
  for (let i = 0; i < hiPhaseLen1; i++) {
    sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
  }

  // decreasing phase 1
  let rate = randfloat(0.8, 0.6);
  for (let i = 0; i < decPhaseLen1; i++) {
    sellPrices[work++] = intceil(rate * basePrice);
    rate -= 0.04;
    rate -= randfloat(0, 0.06);
  }

  // high phase 2
  for (let i = 0; i < hiPhaseLen2and3 - hiPhaseLen3; i++) {
    sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
  }

  // decreasing phase 2
  rate = randfloat(0.8, 0.6);
  for (let i = 0; i < decPhaseLen2; i++) {
    sellPrices[work++] = intceil(rate * basePrice);
    rate -= 0.04;
    rate -= randfloat(0, 0.06);
  }

  // high phase 3
  for (let i = 0; i < hiPhaseLen3; i++) {
    sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
  }
  sellPrices.shift();
  sellPrices.shift();
  return sellPrices;
}
function predictPattern0(sellPrices: number[]) {
  const basePrice = sellPrices[0];
  // [low, high] x 14 vals x prediction trees
  let predictions: Prediction[] = [];
  let metadata: {
    decPhaseLen1: number;
    hiPhaseLen1: number;
    hiPhaseLen3: number;
    hiPhaseLen2and3: number;
    decPhaseLen2: number;
  }[] = [];

  [0, 1, 2, 3, 4, 5, 6].forEach((hiPhaseLen1) => {
    // DEVIATION was 2-3
    [2, 3].forEach((decPhaseLen1) => {
      [0, 1, 2, 3, 4, 5, 6].forEach((hiPhaseLen3) => {
        const hiPhaseLen2and3 = 7 - hiPhaseLen1;
        const decPhaseLen2 = 5 - decPhaseLen1;
        if (hiPhaseLen3 > hiPhaseLen2and3 - 1) return;

        metadata.push({
          decPhaseLen1,
          hiPhaseLen1,
          hiPhaseLen3,
          hiPhaseLen2and3,
          decPhaseLen2,
        });
        let blankPrediction: Prediction = { daily: [], decreasingStart: 14 };
        for (let i = 0; i < 14; i++)
          blankPrediction.daily.push([basePrice || 90, basePrice || 110]);
        predictions.push(blankPrediction);
      });
    });
  });

  for (let variation = 0; variation < metadata.length; variation++) {
    const config = metadata[variation];

    // high phase 1
    let work = 2;
    for (let i = 0; i < config.hiPhaseLen1; i++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(0.9 * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(1.4 * basePrice);
      }
      work++;
    }

    // decreasing phase 1
    let minRate = 0.6;
    let maxRate = 0.8;
    for (let i = 0; i < config.decPhaseLen1; i++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(minRate * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(maxRate * basePrice);
      }
      minRate -= 0.04 + 0.06;
      maxRate -= 0.04;
      work++;
    }

    // high phase 2
    for (let i = 0; i < config.hiPhaseLen2and3 - config.hiPhaseLen3; i++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(0.9 * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(1.4 * basePrice);
      }
      work++;
    }

    if (config.hiPhaseLen3 === 0) predictions[variation].decreasingStart = work;

    // decreasing phase 2
    minRate = 0.6;
    maxRate = 0.8;
    for (let i = 0; i < config.decPhaseLen2; i++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(minRate * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(maxRate * basePrice);
      }
      minRate -= 0.04 + 0.06;
      maxRate -= 0.04;
      work++;
    }
    // high phase 3
    for (let i = 0; i < config.hiPhaseLen3; i++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(0.9 * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(1.4 * basePrice);
      }
      work++;
    }
  }

  return predictions;
}
// 2.0 - 6.0 large spike
function pattern1(basePrice: number) {
  basePrice = basePrice || startPrice();
  let sellPrices = [basePrice, basePrice];
  // PATTERN 1: decreasing middle, high spike, random low
  const peakStart = randint(3, 9);
  let rate = randfloat(0.9, 0.85);
  let work = 2;
  for (; work < peakStart; work++) {
    sellPrices[work] = intceil(rate * basePrice);
    rate -= 0.03;
    rate -= randfloat(0, 0.02);
  }
  sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
  sellPrices[work++] = intceil(randfloat(1.4, 2.0) * basePrice);
  sellPrices[work++] = intceil(randfloat(2.0, 6.0) * basePrice);
  sellPrices[work++] = intceil(randfloat(1.4, 2.0) * basePrice);
  sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
  for (; work < 14; work++) {
    sellPrices[work] = intceil(randfloat(0.4, 0.9) * basePrice);
  }
  sellPrices.shift();
  sellPrices.shift();
  return sellPrices;
}
function predictPattern1(sellPrices: number[]) {
  const basePrice = sellPrices[0];
  // [low, high] x 14 vals x prediction trees
  let predictions: Prediction[] = [];
  let metadata: { peakStart: number }[] = [];

  [3, 4, 5, 6, 7, 8, 9].forEach((peakStart) => {
    metadata.push({ peakStart });
    let blankPrediction: Prediction = { daily: [], decreasingStart: 14 };
    for (let i = 0; i < 14; i++)
      blankPrediction.daily.push([basePrice || 90, basePrice || 110]);
    predictions.push(blankPrediction);
  });

  for (let variation = 0; variation < metadata.length; variation++) {
    const config = metadata[variation];
    let minRate = 0.85;
    let maxRate = 0.9;
    let work = 2;
    for (; work < config.peakStart; work++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(minRate * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(maxRate * basePrice);
      }
      minRate -= 0.03 + 0.02;
      maxRate -= 0.03;
    }

    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(0.9 * basePrice);
      predictions[variation].daily[work][1] = Math.ceil(1.4 * basePrice);
    }
    work++;
    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(1.4 * basePrice);
      predictions[variation].daily[work][1] = Math.ceil(2.0 * basePrice);
    }
    work++;
    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(2.0 * basePrice);
      predictions[variation].daily[work][1] = Math.ceil(6.0 * basePrice);
    }
    work++;
    predictions[variation].decreasingStart = work;
    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(1.4 * basePrice);
      predictions[variation].daily[work][1] = Math.ceil(2.0 * basePrice);
    }
    work++;
    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(0.9 * basePrice);
      predictions[variation].daily[work][1] = Math.ceil(1.4 * basePrice);
    }
    work++;

    for (; work < 14; work++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(0.4 * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(0.9 * basePrice);
      }
    }
  }

  return predictions;
}
// 0.9 - 0.3 decreasing
function pattern2(basePrice: number) {
  basePrice = basePrice || startPrice();
  let sellPrices = [basePrice, basePrice];
  // PATTERN 2: consistently decreasing
  let rate = 0.9;
  rate -= randfloat(0, 0.05);
  for (let work = 2; work < 14; work++) {
    sellPrices[work] = intceil(rate * basePrice);
    rate -= 0.03;
    rate -= randfloat(0, 0.02);
  }
  sellPrices.shift();
  sellPrices.shift();
  return sellPrices;
}
function predictPattern2(sellPrices: number[]) {
  const basePrice = sellPrices[0];
  // [low, high] x 14 vals x prediction trees
  let predictions: Prediction[] = [];

  let blankPrediction: Prediction = { daily: [], decreasingStart: 14 };
  for (let i = 0; i < 14; i++)
    blankPrediction.daily.push([basePrice || 90, basePrice || 100]);
  predictions.push(blankPrediction);

  let minRate = 0.9;
  let maxRate = 0.9;

  minRate -= 0.05;
  maxRate -= 0;
  predictions[0].decreasingStart = 2;
  for (let work = 2; work < 14; work++) {
    for (let variation = 0; variation < predictions.length; variation++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(minRate * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(maxRate * basePrice);
      }
    }
    minRate -= 0.03 + 0.02;
    maxRate -= 0.03;
  }
  return predictions;
}
// 1.4 - 2.0 small spike
function pattern3(basePrice: number) {
  basePrice = basePrice || startPrice();
  let sellPrices = [basePrice, basePrice];
  // PATTERN 3: decreasing, spike, decreasing
  const peakStart = randint(2, 9);

  // decreasing phase before the peak
  let rate = randfloat(0.9, 0.4);
  let work = 2;
  for (; work < peakStart; work++) {
    sellPrices[work] = intceil(rate * basePrice);
    rate -= 0.03;
    rate -= randfloat(0, 0.02);
  }

  sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
  sellPrices[work++] = intceil(randfloat(0.9, 1.4) * basePrice);
  rate = randfloat(1.4, 2.0);
  sellPrices[work++] = intceil(randfloat(1.4, rate) * basePrice) - 1;
  sellPrices[work++] = intceil(rate * basePrice);
  sellPrices[work++] = intceil(randfloat(1.4, rate) * basePrice) - 1;

  // decreasing phase after the peak
  if (work < 14) {
    rate = randfloat(0.9, 0.4);
    for (; work < 14; work++) {
      sellPrices[work] = intceil(rate * basePrice);
      rate -= 0.03;
      rate -= randfloat(0, 0.02);
    }
  }

  sellPrices.shift();
  sellPrices.shift();
  return sellPrices;
}
function predictPattern3(sellPrices: number[]) {
  const basePrice = sellPrices[0];
  // [low, high] x 14 vals x prediction trees
  let predictions: Prediction[] = [];
  let metadata: { peakStart: number }[] = [];

  [2, 3, 4, 5, 6, 7, 8, 9].forEach((peakStart) => {
    metadata.push({ peakStart });
    let blankPrediction: Prediction = { daily: [], decreasingStart: 14 };
    for (let i = 0; i < 14; i++)
      blankPrediction.daily.push([basePrice || 90, basePrice || 110]);
    predictions.push(blankPrediction);
  });

  for (let variation = 0; variation < metadata.length; variation++) {
    const config = metadata[variation];
    let minRate = 0.4;
    let maxRate = 0.9;
    let work = 2;
    for (; work < config.peakStart; work++) {
      if (!sellPrices[work]) {
        predictions[variation].daily[work][0] = Math.floor(minRate * basePrice);
        predictions[variation].daily[work][1] = Math.ceil(maxRate * basePrice);
      }
      minRate -= 0.03 + 0.02;
      maxRate -= 0.03;
    }

    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(0.9 * basePrice);
      predictions[variation].daily[work][1] = Math.ceil(1.4 * basePrice);
    }
    work++;
    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(0.9 * basePrice);
      predictions[variation].daily[work][1] = Math.ceil(1.4 * basePrice);
    }
    work++;
    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(1.4 * basePrice) - 1;
      predictions[variation].daily[work][1] = Math.ceil(2 * basePrice) - 1;
    }
    work++;
    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(1.4 * basePrice);
      predictions[variation].daily[work][1] = Math.ceil(2 * basePrice);
    }
    work++;
    if (!sellPrices[work]) {
      predictions[variation].daily[work][0] = Math.floor(1.4 * basePrice) - 1;
      predictions[variation].daily[work][1] = Math.ceil(2 * basePrice) - 1;
    }
    work++;

    predictions[variation].decreasingStart = work;

    if (work < 14) {
      minRate = 0.4;
      maxRate = 0.9;
      for (; work < 14; work++) {
        if (!sellPrices[work]) {
          predictions[variation].daily[work][0] = Math.floor(
            minRate * basePrice
          );
          predictions[variation].daily[work][1] = Math.ceil(
            maxRate * basePrice
          );
        }
        minRate -= 0.03 + 0.02;
        maxRate -= 0.03;
      }
    }
  }

  return predictions;
}
function predictPattern(pattern: number, sellPrices: number[]) {
  if (pattern === 0) return predictPattern0(sellPrices);
  if (pattern === 1) return predictPattern1(sellPrices);
  if (pattern === 2) return predictPattern2(sellPrices);
  if (pattern === 3) return predictPattern3(sellPrices);
  return [];
}

export function runPattern(pattern: number, basePrice: number) {
  if (pattern === 0) return pattern0(basePrice);
  if (pattern === 1) return pattern1(basePrice);
  if (pattern === 2) return pattern2(basePrice);
  if (pattern === 3) return pattern3(basePrice);
  return [];
}

function whichPattern(lastPattern: number) {
  const chance = randint(0, 99);
  switch (lastPattern) {
    case 0:
      if (chance < 20) return 0; // 20
      if (chance < 50) return 1; // 30
      if (chance < 65) return 2; // 15
      return 3; // 35
    case 1:
      if (chance < 50) return 0; // 50
      if (chance < 55) return 1; // 5
      if (chance < 75) return 2; // 20
      return 3; // 25
    case 2:
      if (chance < 25) return 0; // 25
      if (chance < 70) return 1; // 45
      if (chance < 75) return 2; // 5
      return 3; // 25
    case 3:
      if (chance < 45) return 0; // 45
      if (chance < 70) return 1; // 25
      if (chance < 85) return 2; // 15
      return 3; // 15
  }
  return 2;
}
// [
//   "Random",
//   "Large Spike",
//   "Decreasing",
//   "Small Spike"
// ];
function patternProbability(lastPattern: number) {
  if (lastPattern === 0) return [0.2, 0.3, 0.15, 0.35];
  if (lastPattern === 1) return [0.5, 0.05, 0.2, 0.25];
  if (lastPattern === 2) return [0.25, 0.45, 0.05, 0.25];
  if (lastPattern === 3) return [0.45, 0.25, 0.15, 0.15];
  return [0.35, 0.25, 0.15, 0.25];
}
export function startPrice() {
  return randint(90, 110);
}

// [buy, buy, mon am, mon pm, tue am, tue pm...]
export function possiblePatterns(
  sellPrices: number[],
  lastPattern: number = -1,
  firstWeek = false,
  maxMistakes = 0
): { patterns: Pattern[]; maxMistakes: number } {
  if (lastPattern === 5) firstWeek = true;
  // console.log(sellPrices);
  const startPrice = [...sellPrices];
  for (let i = 2; i < startPrice.length; i++) startPrice[i] = 0;
  let predictions: Prediction[][] = [];

  if (firstWeek || !startPrice) {
    for (let i = 0; i < 4; i++) {
      const low = predictPattern(i, [90]);
      const high = predictPattern(i, [110]);
      const range = low.map((l, i) => {
        l.daily.forEach((ld, ii) => {
          ld[1] = high[i].daily[ii][1];
        });
        return l;
      });
      predictions[i] = range;
    }
  } else {
    predictions = [
      predictPattern0(startPrice),
      predictPattern1(startPrice),
      predictPattern2(startPrice),
      predictPattern3(startPrice),
    ];
  }

  // if (2 > 1) predictions = turnipProphetPredict(startPrice[0]);
  // if (2 > 1) predictions = acTurnipsPredict(startPrice);

  // let text: string[] = [];
  // let csv: string[] = [];
  let patterns: Pattern[] = [];

  const prob = patternProbability(lastPattern);

  // has 4 patterns
  predictions.forEach((predictions, idx) => {
    const patternsTemp: typeof patterns = [];

    // all predictions in this pattern
    predictions.forEach((prediction) => {
      const pattern: typeof patterns[0] = {
        dailyPriceRange: [],
        probability: 0,
        type: idx,
        decreasingStart: prediction.decreasingStart,
      };

      // daily prediction
      for (let i = 0; i < 2; i++) {
        pattern.dailyPriceRange.push({
          high: sellPrices[i] || prediction.daily[i][0],
          low: sellPrices[i] || prediction.daily[i][1],
        });
      }
      let mistakes = 0;
      for (let i = 2; i < prediction.daily.length; i++) {
        const low = prediction.daily[i][0];
        const high = prediction.daily[i][1];

        if (!low) return;
        if (!high) return;

        // skip if not within range
        if (sellPrices[i] && sellPrices[i] < low) mistakes++;
        if (sellPrices[i] && sellPrices[i] > high) mistakes++;

        pattern.dailyPriceRange.push({
          high: high,
          low: low,
        });
      }
      if (mistakes > maxMistakes) return;
      // this is a valid pattern, add it
      patternsTemp.push(pattern);
    });

    // probability of each pattern in the prediction
    patternsTemp.forEach((pattern) => {
      pattern.probability = prob[idx] / predictions.length;
    });

    patterns.push(...patternsTemp);
  });

  // if we are in the decreasing/large spike range, reduce the fluctuating/small spike probability
  let smallestRange: { low: number; high: number } = { low: 0, high: 0 };
  let smallestRangeWidth = 99999;
  let smallestRangeDay = 0;
  for (let i = 2; i < 14; i++) {
    const firstPrice = sellPrices[i];
    if (!firstPrice) continue;
    if (patterns.length <= 1) continue;

    patterns.forEach((p) => {
      const width = p.dailyPriceRange[i].high - p.dailyPriceRange[i].low;
      if (width < smallestRangeWidth) {
        smallestRangeWidth = width;
        smallestRange = p.dailyPriceRange[i];
        smallestRangeDay = i;
      }
    });
  }
  // console.log(smallestRange, smallestRangeDay, smallestRangeWidth);
  if (smallestRangeDay) {
    patterns.forEach((p) => {
      const range = p.dailyPriceRange[smallestRangeDay];

      const high = Math.min(smallestRange.high, range.high);
      const low = Math.max(smallestRange.low, range.low);
      if (high < low) return;
      const overlap = Math.max(high - low, 1);
      const totalRange = range.high - range.low;

      p.probability = (p.probability * overlap) / totalRange;
    });
  }

  // normalize probabilities
  const totalProb = patterns.reduce((a, b) => a + b.probability, 0);
  patterns.forEach(
    (pattern) => (pattern.probability = pattern.probability / totalProb)
  );

  if (!patterns.length && !firstWeek)
    return possiblePatterns(sellPrices, lastPattern, true);

  if (!patterns.length && maxMistakes < 10)
    return possiblePatterns(
      sellPrices,
      lastPattern,
      firstWeek,
      maxMistakes + 1
    );

  // patterns.sort((a, b) => b.type - a.type);
  patterns.reverse();

  return { patterns, maxMistakes };
}

export function dailyPredictedPrice(patterns: Pattern[]) {
  let expectedPrices: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let expectedPricesHigh: number[] = [];
  let expectedPricesLow: number[] = [];
  patterns.forEach((pattern) => {
    for (let startDay = 2; startDay < 14; startDay++) {
      let expectedMax = 0;
      let expectedHigh = 0;
      let expectedLow = 0;
      for (let day = startDay; day < 14; day++) {
        const high = pattern.dailyPriceRange[day].high;
        const low = pattern.dailyPriceRange[day].low;
        const expected = (high + low) / 2;
        if (expectedMax < expected) {
          expectedMax = expected;
          expectedHigh = high;
          expectedLow = low;
        }
      }
      expectedPrices[startDay] += expectedMax * pattern.probability;
      expectedPricesLow[startDay] = Math.min(
        expectedPricesLow[startDay] || 99999,
        expectedLow
      );
      expectedPricesHigh[startDay] = Math.max(
        expectedPricesHigh[startDay] || 0,
        expectedHigh
      );
    }
  });
  return {
    price: expectedPrices,
    low: expectedPricesLow,
    high: expectedPricesHigh,
  };
}

export function expectedPrice(patterns: Pattern[], day: number) {
  const expectedPrices = dailyPredictedPrice(patterns);
  let expected = 0;
  let high = 0;
  let low = 0;
  for (let i = day; i < 14; i++) {
    if (expectedPrices.price[i] > expected) {
      expected = expectedPrices.price[i];
      high = expectedPrices.high[i];
      low = expectedPrices.low[i];
    }
  }
  return { expected, high, low };
}

export function simulation(runs = 1000) {
  let pattern = 2;

  let totalProfit = 0;

  for (let i = 0; i < runs; i++) {
    const basePrice = startPrice();
    const result =
      pattern === 0
        ? pattern0(basePrice)
        : pattern === 1
        ? pattern1(basePrice)
        : pattern === 2
        ? pattern2(basePrice)
        : pattern === 3
        ? pattern3(basePrice)
        : [];

    result.unshift(basePrice);
    result.unshift(basePrice);

    for (let i = 3; i < 14; i++) {
      const knownData = [...result];
      for (let j = i; j < 14; j++) knownData[j] = 0;
      const { patterns } = possiblePatterns(knownData);
      const { expected } = expectedPrice(patterns, i + 1);
      const price = result[i];
      // if (price > 125 || i === 13) {
      //   const gain = Math.floor((1000 * (price - basePrice)) / basePrice) / 10;
      //   totalProfit += gain;
      //   console.log(
      //     `Sell on day ${i - 2} at price ${price} return of ${gain}%`
      //   );
      //   break;
      // }
      if (expected <= price || i === 13) {
        const gain = Math.floor((1000 * (price - basePrice)) / basePrice) / 10;
        totalProfit += gain;
        console.log(
          `Sell on day ${i - 2} at price ${price} return of ${gain}%`
        );
        break;
      }
    }
    pattern = whichPattern(pattern);
  }

  console.log("Expected money from investing $100", totalProfit / runs + 100);
}

export function simulateFromPrice(
  sellPrices: number[],
  lastPattern: number = -1,
  maxTime = 1000
) {
  let allPrices: number[] = [];
  let failedRuns = 0;
  let totalSellPrice = 0;
  let bestPossiblePrice = 0;
  sellPrices = [...sellPrices];
  while (sellPrices.length && !sellPrices[sellPrices.length - 1])
    sellPrices.pop();

  const { patterns } = possiblePatterns(sellPrices, lastPattern);
  const probabilityMap = [0, 0, 0, 0];
  patterns.forEach(
    (pattern) => (probabilityMap[pattern.type] += pattern.probability)
  );
  for (let i = 1; i < 4; i++) probabilityMap[i] += probabilityMap[i - 1]; // make cumulitive probability

  const startTime = Date.now();
  const basePrice = sellPrices[0];

  let runs = 0;
  let decreasingRuns = 0;
  while (Date.now() - startTime < maxTime) {
    runs++;

    const rand = Math.random();
    const type =
      rand < probabilityMap[0]
        ? 0
        : rand < probabilityMap[1]
        ? 1
        : rand < probabilityMap[2]
        ? 2
        : 3;
    let result: number[] = [];
    let attempts = 0;
    const buyPrice = basePrice || 100; //startPrice();
    while (true) {
      result = runPattern(type, buyPrice);
      result.unshift(buyPrice);
      result.unshift(buyPrice);
      // make sure it matches a possible pattern
      let match = false;
      patterns.forEach((pattern) => {
        let thisMatches = true;
        pattern.dailyPriceRange.forEach((price, idx) => {
          if (idx <= 1) return;
          if (price.high < result[idx]) thisMatches = false;
          if (price.low > result[idx]) thisMatches = false;
        });
        if (thisMatches) match = true;
      });
      if (match) break;
      if (attempts++ > 100) {
        failedRuns++;
        break;
      }
    }
    if (attempts > 100) continue;

    // make the randomized result start the same as current sell prices
    for (let j = 0; j < sellPrices.length; j++) result[j] = sellPrices[j];

    // find the max price with perfect knowledge of the future
    let maxPrice = 0;
    for (let i = sellPrices.length - 1; i < 14; i++) {
      if (result[i] > maxPrice) maxPrice = result[i];
    }
    bestPossiblePrice += maxPrice;

    for (let i = sellPrices.length; i < 14; i++) {
      const knownData = [...result];
      for (let j = i + 1; j < 14; j++) knownData[j] = 0;
      const { patterns } = possiblePatterns(knownData);
      const { expected } = expectedPrice(patterns, i + 1);
      let price = result[i];
      // if (price > 125 || i === 13) {
      //   const gain = Math.floor((1000 * (price - basePrice)) / basePrice) / 10;
      //   totalSellPrice += gain;
      //   console.log(
      //     `Sell on day ${i - 2} at price ${price} return of ${gain}%`
      //   );
      //   break;
      // }
      const isDecreasing = patterns.every((p) => p.decreasingStart <= i);
      if (isDecreasing && i === sellPrices.length) {
        price = sellPrices[i - 1];
        decreasingRuns++;
      }
      if (expected <= price || i === 13 || isDecreasing) {
        totalSellPrice += price;
        // console.log(result);
        // console.log(
        //   `Sell on day ${i -
        //     2} at price ${price} return of ${gain}% - expected = ${expected}`
        // );
        // if (price < 40) console.log(knownData);
        allPrices.push(price);
        break;
      }
    }
  }

  // console.log("Expected money from investing $100", totalProfit / RUNS + 100);
  return {
    expectedPrice: totalSellPrice / (runs - failedRuns),
    bestExpectedPrice: bestPossiblePrice / (runs - failedRuns),
    allPrices,
    isDecreasing: runs - failedRuns === decreasingRuns,
  };
}

export function makeHistogram(prices: number[], bucketSize: number) {
  const counts: number[] = [];
  for (let i = 0; i <= 700; i += bucketSize) counts[i / bucketSize] = 0;

  prices.forEach((price) => {
    const idx = Math.round(price / bucketSize);
    counts[idx]++;
  });
  counts.forEach((c, i) => (counts[i] = (c / prices.length) * 100));
  return counts;
}

export function makeGroupings(
  prices: number[],
  patterns: Pattern[]
): Grouping[] {
  const groupings: Grouping[] = [];
  for (let i = 0; i < 4; i++) {
    groupings.push({
      probability: 0,
      type: i,
      minPrice: 660,
      maxPrice: 0,
    });
  }

  let currentDay = 0;
  let currentPrice = 0;
  prices.forEach((p, i) => {
    if (p) {
      currentDay = i;
      currentPrice = p;
    }
  });

  patterns.forEach((p) => {
    const group = groupings[p.type];
    group.probability += p.probability;
    if (p.type !== 2) {
      group.minPrice = Math.min(
        group.minPrice,
        Math.max(
          ...p.dailyPriceRange
            .filter((_, i) => i >= currentDay)
            .map((i) => i.low)
        )
      );
      group.maxPrice = Math.max(
        group.maxPrice,
        Math.max(
          ...p.dailyPriceRange
            .filter((_, i) => i >= currentDay)
            .map((i) => i.high)
        )
      );
    } else {
      //decreasing
      group.minPrice = p.dailyPriceRange[Math.max(currentDay, 9)].low;
      group.maxPrice = p.dailyPriceRange[Math.max(currentDay, 9)].high;
    }
  });

  return [groupings[2], groupings[0], groupings[3], groupings[1]];
}

// const prices = simulateFromPrice([100, 100, 90, 85], 0);
// const hist = histogram(prices);
// console.log(hist.join("\n"));

// console.log(possiblePatterns([98, 98, 59, 55, 51, 48, 44, 41, 38, 120, 154]));
// simulation();
// console.log(predictPattern0([100, 100]));

// console.log(possiblePatterns([100]).csv.join("\n"));
