import React from "react";
import "./App.css";
import { Turnips } from "./Turnips";
import { getUserLanguage, i18nSetLocale, i18n } from "./i18n/i18n";

function App() {
  const locale = getUserLanguage();
  i18nSetLocale(locale);
  const elem = document.getElementById("title");
  if (elem)
    elem.innerHTML =
      i18n("Turnip Price Calculator") +
      ": " +
      i18n("Animal Crossing New Horizons");
  return (
    <div className="App">
      <Turnips />
    </div>
  );
}

export default App;
