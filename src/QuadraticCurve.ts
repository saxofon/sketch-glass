/// <reference path="../typings/bundle.d.ts" />
"use strict";

import Point = require("./Point");
import Curve = require("./Curve");
import Line = require("./Line");
import _ = require("lodash");
var Bezier = require("bezier-js");

class QuadraticCurve {
  start: Point;
  control: Point;
  end: Point;

  constructor(start: Point, control: Point, end: Point) {
    this.start = start;
    this.control = control;
    this.end = end;
  }

  midpoint() {
    var xy = this._bezier().get(0.5);
    return new Point(xy.x, xy.y);
  }

  _bezier() {
    return new Bezier([this.start, this.control, this.end]);
  }

  toString() {
    return `QuadraticCurve(${this.start},${this.control},${this.end})`;
  }

  static fromCubic(cubicCurve: Curve) {
    var torelance = cubicCurve.end.sub(cubicCurve.start).length / 100;
    var result = cubicToQuadratic(cubicCurve, torelance * torelance);
    return result;
  }
}

function quadraticApproximation(cubicCurve: Curve) {
  var p1 = cubicCurve.start;
  var c1 = cubicCurve.control1;
  var c2 = cubicCurve.control2;
  var p2 = cubicCurve.end;
  var c = c1.add(c2).mul(0.75).sub(p1.add(p2).mul(0.25));
  return new QuadraticCurve(p1, c, p2);
}

function cubicToQuadratic(cubicCurve: Curve, torelanceSquare: number): QuadraticCurve[] {
  var quadraticCurve = quadraticApproximation(cubicCurve);
  var diff = cubicCurve.midpoint().sub(quadraticCurve.midpoint());
  if (diff.lengthSquare() <= torelanceSquare) {
    return [quadraticCurve];
  }

  return cubicCurve.divide()
    .map(c => cubicToQuadratic(c, torelanceSquare))
    .reduce((a, b) => a.concat(b));
}

export = QuadraticCurve;