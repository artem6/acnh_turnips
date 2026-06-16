/*
const setValue = (elem, value) => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  nativeInputValueSetter.call(elem, value);
  elem && elem.dispatchEvent(new Event('input', { bubbles: true }));
}

const inputs = [...document.querySelectorAll('input')];
setValue(inputs[0], 100);
inputs.shift();
*/

import { Prediction, Pattern } from "../turnipCalculator";
import * as acTurnips from "./acTurnips.js";

const { possiblePatterns } = acTurnips as any;

export const acTurnipsPredict = (prices: number[]) => {
  const patterns = possiblePatterns(prices);
  const prediction: Prediction[][] = [];

  patterns.forEach((p: any) => {
    const type = p.pattern as number;
    const price: [number, number][] = [
      [90, 110],
      [90, 110],
    ];
    for (let i = 0; i < 12; i++) {
      price.push(p[i]);
    }
    prediction[type] = prediction[type] || [];
    prediction[type].push({ daily: price, decreasingStart: 14 });
  });

  // console.log(prediction);

  return prediction;
};

export const acTurnipsPossiblePatterns = (
  prices: number[]
): { patterns: Pattern[] } => {
  const rawPatterns = possiblePatterns(prices);

  const patterns: Pattern[] = [];
  /*
  
  dailyPriceRange: { low: number; high: number }[];
  probability: number;
  type: number; // 0|1|2|3;
  decreasingStart: number; // first day of a decreasing pattern

  */

  rawPatterns.forEach((p: any) => {
    const prices: [number, number][] = [
      [90, 110],
      [90, 110],
    ];
    for (let i = 0; i < 12; i++) {
      prices.push(p[i]);
    }
    const dailyPriceRange = prices.map((p) => ({ low: p[0], high: p[1] }));
    patterns.push({
      dailyPriceRange,
      probability: p.probability,
      type: p.type,
      decreasingStart: 14,
    });
  });

  return { patterns };
};

// acTurnipsPredict([100, 100]);
