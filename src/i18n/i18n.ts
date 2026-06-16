const languageModule = import.meta.glob<string>("./*.json", {
  eager: true,
  import: "default",
});

const localizations: Record<string, any> = {
  en: languageModule["./en.json"],
  ja: languageModule["./ja.json"],
};

let locale = "en";
export function i18nSetLocale(newLocale: string) {
  locale = newLocale.split("-")[0].toLocaleLowerCase();
}
export function i18nGetLocale() {
  return locale;
}

export function getUserLanguage() {
  const queryLocale = window.location.search.match(/locale=([^&]+)/);
  // console.log(queryLocale);
  const locale = queryLocale?.[1];
  return (
    locale ||
    (window?.navigator as any)?.userLanguage ||
    window?.navigator?.language
  );
}

function getLocalized(str: string): string {
  const localized = localizations?.[locale]?.[str];
  if (!localized) {
    const loc = (window as any).localizationsNeeded || {};
    loc[locale] = loc[locale] || {};
    loc[locale][str] = str;
    (window as any).localizationsNeeded = loc;
    // console.log(`${locale} Localization needed for "${str}"`);
  }
  return localized || localizations?.["en"]?.[str] || str;
}
export function i18n(
  str: string,
  values?: { [key: string]: string | number }
): string {
  str = getLocalized(str);
  if (values)
    Object.keys(values).forEach((key) => {
      str = str.replace(`{${key}}`, `${values[key]}`);
    });
  return str;
}
export function i18nJsx(str: string, values: { [key: string]: any }): any[] {
  str = getLocalized(str);
  const response = [str];
  Object.keys(values).forEach((key) => {
    response.forEach((res, idx) => {
      if (typeof res === "string") {
        const newRes = res.split(`{${key}}`);
        if (newRes.length === 2) {
          response.splice(idx, 1, newRes[0], values[key], newRes[1]);
        }
      }
    });
  });
  return response;
}
