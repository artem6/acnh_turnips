import { possiblePatterns, runPattern, startPrice } from "../turnipCalculator";

test.skip("full price list pattern prediction always covers generated patterns", () => {
  for (let pattern = 0; pattern < 4; pattern++) {
    for (let i = 0; i < 10000; i++) {
      const base = startPrice();
      const prices = runPattern(pattern, base);
      prices.unshift(base, base);
      const prediction = possiblePatterns(prices);
      if (
        prediction.patterns.length !== 1 ||
        prediction.patterns[0].type !== pattern
      ) {
        console.log("================");
        console.log(pattern);
        console.log(prices);
        console.log(prediction);
      }
    }
  }
});
