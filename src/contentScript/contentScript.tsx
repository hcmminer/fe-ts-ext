// TODO: content script
import React from "react";
import ReactDOM from "react-dom";
import "../static/global.css";
import {FloatingButton} from "../components/FloatingButton";
import {TranslationBox} from "../components/TranslationBox";


const root1 = document.createElement('div');
const root2 = document.createElement('div');
document.body.appendChild(root1);
document.body.appendChild(root2);

ReactDOM.render(<FloatingButton />, root1);  // Render FloatingButton vào root1
ReactDOM.render(<TranslationBox/>, root2);  // Render TranslationBox vào root2