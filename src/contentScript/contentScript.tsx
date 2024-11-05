// TODO: content script
import React from "react";
import ReactDOM from "react-dom";
import "../static/global.css";
import {Card} from "../components/Card"

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render( <Card />, root)