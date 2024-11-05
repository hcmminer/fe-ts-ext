// TODO: content script
import React from "react";
import ReactDOM from "react-dom";
import "../static/global.css";
import {FloatingButton} from "../components/FloatingButton";


const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render( <FloatingButton />, root)