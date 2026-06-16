/*
Turnip Logic: https://gist.github.com/Treeki/85be14d297c80c8b3c0a76375743325b
Turnip Prophet: https://turnipprophet.io or https://github.com/mikebryant/ac-nh-turnip-prices/blob/master/js/predictions.js
AC Turnip: https://ac-turnip.com or https://github.com/elxris/Turnip-Calculator/blob/master/src/utils/patterns.js


*/
import React, { useEffect, useState, useMemo } from "react";
import {
  possiblePatterns,
  patternNames,
  expectedPrice,
  simulateFromPrice,
  makeHistogram,
  makeGroupings,
} from "./turnipCalculator";
import { Chart, ChartData } from "./Chart";
import * as storageService from "./storageService";

import style from "./Turnips.module.css";
import DelayedRender from "./DelayedRender";
import { i18n, i18nJsx } from "./i18n/i18n";
import {
  setTurnipPricesUrl,
  getTurnipPricesUrl,
  generateUrl,
  resetUrl,
} from "./urlService";
import { LocaleSelect } from "./LocaleSelect";
import image from "./icon-128.png";
// import { acTurnipsPossiblePatterns } from "./otherPatterns/acTurnipsPatterns";

const DAYS = () => [
  i18n("Sun AM: Buy"),
  i18n("Sun PM"),
  i18n("Mon AM"),
  i18n("Mon PM"),
  i18n("Tue AM"),
  i18n("Tue PM"),
  i18n("Wed AM"),
  i18n("Wed PM"),
  i18n("Thu AM"),
  i18n("Thu PM"),
  i18n("Fri AM"),
  i18n("Fri PM"),
  i18n("Sat AM"),
  i18n("Sat PM"),
];

const urlPrices = getTurnipPricesUrl();

if (urlPrices) {
  resetUrl();
}

const turnipPriceStore = urlPrices || storageService.get("turnipPriceStore");
let simulationRun = 0;

let lastLog = "";
function logPrices(pattern: number, prices: number[]) {
  try {
    const log = [pattern, ...prices].map((a) => a || "").join(",");
    if (log !== lastLog) {
      lastLog = log;
      // console.log("logging", log);
      (window as any).ga("send", {
        hitType: "event",
        eventCategory: "Set Price",
        eventAction: "click",
        eventLabel: log,
      });
    }
  } catch (e) {
    console.log(e);
  }
}

function deepCopy<T>(a: T): T {
  return JSON.parse(JSON.stringify(a));
}

function cleanPrices(prices: number[]) {
  while (prices?.length && !prices[prices.length - 1]) prices.pop();
  return prices;
}
cleanPrices(turnipPriceStore?.prices);

const PriceForm = (props: {
  onChange: { (price: number[], lastPattern: number): unknown };
  currentPattern: number;
  maxMistakes: number;
}) => {
  const [lastPattern, setLastPattern] = useState(
    turnipPriceStore?.lastPattern !== undefined
      ? turnipPriceStore.lastPattern
      : 4
  );
  const [prices, setPrices] = useState<number[]>(
    turnipPriceStore?.prices || []
  );

  const [showShare, setShowShare] = useState(false);

  // useEffect(() => {
  //   window.onpopstate = function (e: {
  //     state: { prices: number[]; lastPattern: number; maxMistakes: number };
  //   }) {
  //     const data = e.state;
  //     console.log(data);
  //     if (data) {
  //       setPrices(data.prices);
  //       setLastPattern(data.lastPattern);
  //     }
  //   };
  // }, []);

  const changePrice = (day: number) => (e: { target: { value: string } }) => {
    const newPrices = [...prices];
    newPrices[day] = parseFloat(e.target.value);
    if (day === 0) newPrices[1] = newPrices[0] || (undefined as any);
    setPrices(newPrices);
  };
  const resetForm = () => {
    if (
      !window.confirm(
        i18n(
          "Are you sure you want to reset the calculator? This cannot be undone."
        )
      )
    )
      return;
    setPrices([]);
    setLastPattern(props.currentPattern);
  };
  const shareLink = () => {
    setShowShare(true);
    setTimeout(() => {
      try {
        const elem = document.getElementById("share-link") as HTMLInputElement;
        if (!elem) return;
        elem.select();
        elem.setSelectionRange(0, 99999);
        document.execCommand("copy");
      } catch (e) {}
    }, 500);
  };
  useDebounce(() => {
    if (!urlPrices)
      storageService.set("turnipPriceStore", { prices, lastPattern });
    setTurnipPricesUrl({ prices, lastPattern, maxMistakes: props.maxMistakes });
    props.onChange(prices, lastPattern);
  }, 1000);
  return (
    <>
      <div className={style.instructions}>
        {i18n(
          `Turnip prices change every day in the morning and at noon. Enter prices from your own island even if you purchased on a different island. Missing a few prices is ok.`
        )}
      </div>
      <div>
        {i18n(`Last week's pattern`) + " "}
        <select
          onChange={(e) => setLastPattern(parseInt(e.target.value))}
          className={style.patternSelect}
        >
          {patternNames().map((name, idx) => (
            <option selected={idx === lastPattern} value={idx}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className={style.priceTable}>
        <span className={style.formDay}>
          <input
            type="number"
            value={prices[0] || ""}
            onChange={changePrice(0)}
            placeholder={i18n("AM")}
          />
          <div className={style.dayName}>{i18n("Buy Price")}</div>
        </span>
        <span className={style.formDay}>
          <input
            type="number"
            value={prices[2] || ""}
            onChange={changePrice(2)}
            placeholder={i18n("AM")}
          />
          <input
            type="number"
            value={prices[3] || ""}
            onChange={changePrice(3)}
            placeholder={i18n("PM")}
          />
          <div className={style.dayName}>{i18n("Monday")}</div>
        </span>
        <span className={style.formDay}>
          <input
            type="number"
            value={prices[4] || ""}
            onChange={changePrice(4)}
            placeholder={i18n("AM")}
          />
          <input
            type="number"
            value={prices[5] || ""}
            onChange={changePrice(5)}
            placeholder={i18n("PM")}
          />
          <div className={style.dayName}>{i18n("Tuesday")}</div>
        </span>
        <span className={style.formDay}>
          <input
            type="number"
            value={prices[6] || ""}
            onChange={changePrice(6)}
            placeholder={i18n("AM")}
          />
          <input
            type="number"
            value={prices[7] || ""}
            onChange={changePrice(7)}
            placeholder={i18n("PM")}
          />
          <div className={style.dayName}>{i18n("Wednesday")}</div>
        </span>
        <span className={style.formDay}>
          <input
            type="number"
            value={prices[8] || ""}
            onChange={changePrice(8)}
            placeholder={i18n("AM")}
          />
          <input
            type="number"
            value={prices[9] || ""}
            onChange={changePrice(9)}
            placeholder={i18n("PM")}
          />
          <div className={style.dayName}>{i18n("Thursday")}</div>
        </span>
        <span className={style.formDay}>
          <input
            type="number"
            value={prices[10] || ""}
            onChange={changePrice(10)}
            placeholder={i18n("AM")}
          />
          <input
            type="number"
            value={prices[11] || ""}
            onChange={changePrice(11)}
            placeholder={i18n("PM")}
          />
          <div className={style.dayName}>{i18n("Friday")}</div>
        </span>
        <span className={style.formDay}>
          <input
            type="number"
            value={prices[12] || ""}
            onChange={changePrice(12)}
            placeholder={i18n("AM")}
          />
          <input
            type="number"
            value={prices[13] || ""}
            onChange={changePrice(13)}
            placeholder={i18n("PM")}
          />
          <div className={style.dayName}>{i18n("Saturday")}</div>
        </span>
        {prices.length > 2 ? (
          <span className={style.resetForm} onClick={resetForm}>
            {i18n("Reset Calculator")}
          </span>
        ) : null}
        <span className={style.shareLink} onClick={shareLink}>
          {i18n("Share Link")}
          <input
            id="share-link"
            type="text"
            style={{ display: showShare ? "block" : "none" }}
            value={
              generateUrl({
                prices,
                lastPattern,
                maxMistakes: props.maxMistakes,
              }).shareUrl
            }
          />
        </span>
      </div>
    </>
  );
};

function useDebounceFn(func: { (): unknown }, delay: number, deps: any[]) {
  const [data] = useState({ id: (0 as unknown) as NodeJS.Timeout });

  useEffect(() => {
    clearTimeout(data.id);
    data.id = setTimeout(() => {
      func();
    }, delay);
  }, [...deps]);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value]);
  return debouncedValue;
}

interface SimulationResult {
  histogram: number[];
  expected: number;
  high: number;
  low: number;
  bucketSize: number;
}

export const Turnips = () => {
  // [
  //   "Random",
  //   "Large Spike",
  //   "Decreasing",
  //   "Small Spike"
  // ];
  const [lastPattern, setLastPattern] = useState(4);
  const [prices, setPrices] = useState<number[]>([]);
  // const prices = [98, 98]; // , 59, 55, 51, 48, 44, 41, 38, 120, 117, 154
  const [simulated, setSimulated] = useState<SimulationResult | null>(null);

  // account for missing buy price - not working with simulation
  let correctedPrices = [...prices];
  let correctedLastPattern = lastPattern;
  let { patterns, maxMistakes } = possiblePatterns(
    correctedPrices,
    correctedLastPattern
  );
  const groupings = makeGroupings(prices, patterns);

  // localhost only
  if (patterns.length === 0) {
    // patterns = possiblePatterns(
    //   [correctedPrices[0], correctedPrices[0]],
    //   correctedLastPattern
    // ).patterns;
    // patterns = acTurnipsPossiblePatterns(correctedPrices).patterns;
  }

  let currentDay = 0;
  let currentPrice = 0;
  correctedPrices.forEach((p, i) => {
    if (p) {
      currentDay = i;
      currentPrice = p;
    }
  });

  let currentPattern = patterns.reduce((last, p) => {
    if (last === 5) return p.type;
    if (p.type === last) return p.type;
    return 4;
  }, 5);
  if (currentPattern === 5) currentPattern = 4;

  const expected = expectedPrice(patterns, currentDay + 1);
  const isDecreasing = patterns.every(
    (p) => p.decreasingStart <= currentDay + 1
  );

  // if (patterns.length > 1) {
  //   const masterPattern = cloneDeep(patterns[0]);
  //   patterns.forEach(pattern => {
  //     pattern.forEach((val, i) => {
  //       if (masterPattern[i].high < val.high) masterPattern[i].high = val.high;
  //       if (masterPattern[i].low > val.low) masterPattern[i].low = val.low;
  //     });
  //   });
  //   patterns.unshift(masterPattern);
  // }

  const charts: ChartData[] = patterns.map((pattern) => {
    const area = pattern.dailyPriceRange.map((p, i) => ({
      x: i,
      y0: p.low as number,
      y1: p.high as number,
    }));
    return {
      lines: [
        {
          data: pattern.dailyPriceRange.map((p, i) => ({
            x: i,
            y: prices[i],
          })),
        },
      ],
      areas: [{ data: area, opacity: pattern.probability * 4 }],
      title: `${patternNames()[pattern.type]} (${
        Math.round(pattern.probability * 1000) / 10
      }%)`,
    };
  });

  if (patterns.length > 1) {
    const masterChart: ChartData = {
      lines: [
        {
          data: patterns[0].dailyPriceRange.map((p, i) => ({
            x: i,
            y: prices[i],
          })),
        },
      ],
      areas: charts.map((c) => c.areas[0]),
      title: i18n("All Possible Prices"),
    };
    charts.forEach(
      (chart) => (chart.areas[0] = { ...chart.areas[0], opacity: 1 })
    );
    charts.unshift(masterChart);
  }

  const simulate = async (iterations = 20) => {
    const currentRun = ++simulationRun;
    // console.log("simulate=================", prices, lastPattern);
    if (!charts.length) return;
    // if (!prices.filter(Boolean).length) return;
    let expectedPrice = 0;
    let allPrices = [] as number[];
    for (let i = 0; i <= iterations; i++) {
      const res = simulateFromPrice(prices, lastPattern, 50);
      // console.log({ ...res, allPrices: allPrices.length });
      expectedPrice += res.expectedPrice * res.allPrices.length;
      allPrices.push(...res.allPrices);
      await new Promise((r) => setTimeout(r, 100));

      if (currentRun !== simulationRun) return;
      if (i && i % 10 === 0) {
        let bucketSize = 10;
        if (allPrices.length > 5000) bucketSize = 5;
        let histogram = makeHistogram(allPrices, bucketSize);
        // if (allPrices.length > 5000) histogram = histogram.map((p) => p * 2);
        setSimulated({
          histogram,
          expected: expectedPrice / allPrices.length,
          low: Math.min(...allPrices),
          high: Math.max(...allPrices),
          bucketSize,
        });
        console.log("simulations ran: ", allPrices.length);
      }
    }
  };
  useEffect(
    () =>
      setSimulated({
        ...(simulated as SimulationResult),
        expected: 0,
        high: 0,
        low: 0,
      }),
    [prices, lastPattern]
  );
  useDebounceFn(simulate, 1000, [prices, lastPattern]);

  return (
    <div className={style.container}>
      <LocaleSelect />
      <h1 className={style.title}>
        <img src={image} width={32} />
        <span>{i18n("Turnip Price Calculator")}</span>
        <img src={image} width={32} />
      </h1>
      <h2 className={style.subTitle}>{i18n(`Animal Crossing New Horizons`)}</h2>
      <PriceForm
        onChange={(prices, pattern) => {
          logPrices(pattern, prices);
          setPrices(prices);
          setLastPattern(pattern);
        }}
        maxMistakes={maxMistakes}
        currentPattern={currentPattern}
      />
      {
        <>
          {currentDay === 13 ? (
            <div className={style.recommendation}>
              {i18n(
                "End of the week. You should sell now or your turnips will spoil."
              )}
            </div>
          ) : isDecreasing ? (
            <div className={style.recommendation}>
              {i18n("Sell Now!! Prices will only decrease from here.")}
            </div>
          ) : maxMistakes > 0 ? (
            <div className={style.recommendation}>
              {i18n(
                "It's a bit tough to make a prediction with these prices, but see the charts below for our best guess."
              )}
            </div>
          ) : (
            <div
              className={style.recommendation}
              style={{ opacity: simulated?.expected ? 1 : 0.5 }}
            >
              {currentDay > 0
                ? (simulated?.expected || expected.expected) > currentPrice
                  ? i18n(`Recommendation is to hold.`) + " "
                  : i18n(`Sell Now!!`) + " "
                : null}
              {i18nJsx(
                "Prices are expected to be {price} in the future with a low of {low} and a high of {high}.",
                {
                  price: (
                    <b>
                      {Math.round(simulated?.expected || expected.expected)}
                    </b>
                  ),
                  low: (
                    <span style={{ color: "red" }}>
                      {Math.min(
                        expected.low,
                        simulated?.low || 999,
                        ...groupings.map((g) => g.minPrice)
                      )}
                    </span>
                  ),
                  high: (
                    <span style={{ color: "green" }}>
                      {Math.max(expected.high, simulated?.high || 0)}
                    </span>
                  ),
                }
              )}
            </div>
          )}
          <div className={style.groupingContainer}>
            {groupings
              .filter((g) => g.probability)
              .map((group) => {
                return (
                  <span
                    className={`${style.groupingForm} ${
                      style[`pattern${group.type}`]
                    }`}
                    key={group.type}
                  >
                    <div className={style.percent}>
                      {Math.round(group.probability * 100)}%
                    </div>
                    <div>{patternNames()[group.type]}</div>
                    <div>
                      {group.minPrice}-{group.maxPrice}
                    </div>
                  </span>
                );
              })}
          </div>
          <span /* onClick={() => simulate(50)} */>
            <Chart
              data={{
                lines: [
                  {
                    data:
                      simulated?.histogram?.map((y, i) => ({
                        x: i * simulated.bucketSize,
                        y,
                      })) || [],
                  },
                ],
                areas: [],
                title: i18n("Probability"),
              }}
              options={{
                xDomain: [0, 600], //histDomain.x,
                yDomain: [0, 25], //histDomain.y,
                yTickFormat: (a: any) => `${a}%`,
              }}
              calloutMessage={(selectedPoints) => {
                const x = selectedPoints.allLines[0].x;
                const y = selectedPoints.allLines[0].y;
                // const day = DAYS[x];
                // const yPos = allLines[0]?.y;
                // const yMax = Math.max(...(allAreas || []).map(p => p.y1));
                // const yMin = Math.min(...(allAreas || []).map(p => p.y0));

                return {
                  text: i18n(`Price {price} expected {percent}%`, {
                    price: x,
                    percent: Math.round(y * 10) / 10,
                  }),
                };
              }}
            />
          </span>
          {charts.map((chart, idx) => {
            // make the chart lines wider instead of pointy
            const fatData = deepCopy(chart);
            fatData.areas.forEach((area) => {
              area.data = area.data.flatMap((a) => [
                { ...a, x: a?.x + 0.1 },
                { ...a, x: a?.x + 0.9 },
              ]);
            });
            const newLines: typeof fatData.lines = [];
            let curLine: typeof newLines[0] = { data: [] };

            // handle missing data
            fatData.lines.forEach((line) => {
              line.data.forEach((a) => {
                if (!a.y) {
                  if (curLine.data.length) {
                    newLines.push(curLine);
                    curLine = { data: [] };
                  }
                } else {
                  curLine.data.push(
                    ...[
                      { ...a, x: a?.x + 0.1 },
                      { ...a, x: a?.x + 0.9 },
                    ]
                  );
                }
              });
              if (curLine.data.length) {
                newLines.push(curLine);
                curLine = { data: [] };
              }
            });

            fatData.lines = newLines;

            return (
              <DelayedRender
                width={380}
                height={360}
                key={`${idx}-${JSON.stringify(chart)}`}
              >
                <Chart
                  data={fatData}
                  options={{
                    yDomain: [0, 600],
                    xDomain: [0, 14],
                    xTickFormat: (d: number) =>
                      [
                        i18n("Buy"),
                        "",
                        i18n("Mon"),
                        "",
                        i18n("Tue"),
                        "",
                        i18n("Wed"),
                        "",
                        i18n("Thu"),
                        "",
                        i18n("Fri"),
                        "",
                        i18n("Sat"),
                        "",
                      ][d as number],
                  }}
                  calloutMessage={(selectedPoints) => {
                    let x = Math.round(selectedPoints.allLines[0]?.x);
                    if (isNaN(x)) x = Math.floor(selectedPoints.allAreas[0]?.x);
                    const day = DAYS()[x];
                    const yMax = Math.max(
                      ...(selectedPoints.allAreas || []).map((p) => p.y1)
                    );
                    const yMin = Math.min(
                      ...(selectedPoints.allAreas || []).map((p) => p.y0)
                    );

                    return {
                      text: i18n(`{day} price {yMin} - {yMax}`, {
                        day,
                        yMin,
                        yMax,
                      }),
                      xCallout: x + 0.5,
                    };
                  }}
                />
              </DelayedRender>
            );
          })}
        </>
      }
    </div>
  );
};
