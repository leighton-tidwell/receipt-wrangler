import { render } from "preact";
import Router from "preact-router";
import { App } from "./app";
import "./index.css";

render(<App />, document.getElementById("app")!);
