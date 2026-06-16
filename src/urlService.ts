export function getTurnipPricesUrl() {
  try {
    const queryPrices = window.location.search.match(/prices=([^&]+)/);
    if (!queryPrices) return null;
    const prices: number[] = JSON.parse(queryPrices[1]);
    const lastPattern = prices.shift();
    prices.unshift(prices[0]);
    if (!prices.length) return null;
    if (prices.length > 14) return null;
    return { prices, lastPattern };
  } catch (e) {
    return null;
  }
}
let lastIframeUrl = "";
export function setTurnipPricesUrl(data: {
  prices: number[];
  lastPattern: number;
  maxMistakes: number;
}) {
  try {
    const { iframeUrl, baseUrl } = generateUrl(data);
    // if (lastIframeUrl !== iframeUrl) {
    //   window.history.pushState(deepCopy(data), "", oldUrl);
    // }

    if (lastIframeUrl !== iframeUrl) {
      if (baseUrl.indexOf("localhost:300") === -1) {
        const iframe = document.getElementById("priceData");
        if (iframe) (iframe as HTMLImageElement).src = iframeUrl;
      }
    }
  } catch (e) {}
}

export function generateUrl(data: {
  prices: number[];
  lastPattern: number;
  maxMistakes: number;
}) {
  try {
    const oldUrl = window.location.href;
    const oldSearch = window.location.search;
    let newSearch = oldSearch;
    newSearch = newSearch.replace(/[\?\&]prices=([^&]+)/, "");
    if (newSearch.indexOf("?") !== -1) newSearch += "&";
    else newSearch += "?";
    const prices = [...data.prices];
    prices.shift();
    newSearch += `prices=${JSON.stringify([data.lastPattern, ...prices])}`;
    const newUrl = oldSearch
      ? oldUrl.replace(oldSearch, newSearch)
      : oldUrl + newSearch;

    const baseUrl = oldUrl.split("?")[0];

    const shareUrl =
      baseUrl + `?prices=${JSON.stringify([data.lastPattern, ...prices])}`;

    const iframeUrl = `/acnh_turnips/prices.html?p=${JSON.stringify([
      data.lastPattern,
      ...prices,
    ])}${data.maxMistakes > 0 ? "&deviation" : ""}`;

    return {
      oldUrl,
      baseUrl,
      newUrl,
      iframeUrl,
      shareUrl,
    };
  } catch (e) {
    return {
      baseUrl: "",
      newUrl: "",
      iframeUrl: "",
      shareUrl: "",
    };
  }
}
export function resetUrl() {
  try {
    const oldUrl = window.location.href;
    const baseUrl = oldUrl.split("?")[0];
    window.history.pushState(null, "", baseUrl);
  } catch (e) {}
}
