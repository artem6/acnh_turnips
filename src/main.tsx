import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

window.addEventListener("error", (err) => {
  try {
    window.ga("send", "exception", {
      exDescription: (err as Error).message,
      exFatal: true,
    });
  } catch (err) {}
  console.error(err);
});
