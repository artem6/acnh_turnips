import React from "react";
import { i18nGetLocale } from "./i18n/i18n";
import style from "./LocaleSelect.module.css";

const flagsModule = import.meta.glob<string>("./i18n/flags/*.gif", {
  eager: true,
  import: "default",
});

const flags: { [locale: string]: string } = {
  en: flagsModule["./i18n/flags/en.gif"],
  ja: flagsModule["./i18n/flags/jp.gif"],
};

// console.log(flags, flags[i18nGetLocale()]);

const locales: { [locale: string]: string } = { en: "eng", ja: "日本" };

i18nGetLocale();

export const LocaleSelect = () => {
  const setLocale = (loc: string) => {
    window.location.href =
      window.location.href.split("?")[0] + "?locale=" + loc;
  };
  return (
    <div className={style.container}>
      <img src={flags[i18nGetLocale()] || flags["en"]}></img>
      <select
        className={style.localeSelect}
        onChange={(e) => setLocale(e.target.value)}
      >
        {Object.keys(locales).map((name, idx) => (
          <option selected={name === i18nGetLocale()} value={name}>
            {locales[name]}
          </option>
        ))}
      </select>
    </div>
  );
};
