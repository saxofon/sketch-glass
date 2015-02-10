/// <reference path="../typings/bundle.d.ts" />
'use strict';

import Renderer = require('./Renderer');
import Board = require('./Board');
import Point = require('./Point');
import Transform = require('./Transform');

function touchPoint(touch: Touch) {
  return new Point(touch.clientX, touch.clientY);
}

class CanvasViewController {

  view: HTMLElement;
  renderer: Renderer;
  board: Board;
  isPressed = false;
  pinchStartPoints: Point[];
  isPinching = false;
  initialTransform = Transform.identity();

  constructor() {

    this.renderer = new Renderer();
    var view = this.view = this.renderer.view;
    this.board = new Board(this.renderer);

    view.addEventListener('mousemove', this.onMouseMove.bind(this));
    view.addEventListener('mousedown', this.onMouseDown.bind(this));
    view.addEventListener('mouseup', this.onMouseUp.bind(this));

    view.addEventListener('touchmove', this.onTouchMove.bind(this));
    view.addEventListener('touchstart', this.onTouchStart.bind(this));
    view.addEventListener('touchend', this.onTouchEnd.bind(this));

    view.addEventListener('wheel', this.onWheel.bind(this));
  }

  pinchStart(points: Point[]) {
    this.isPinching = true;
    this.pinchStartPoints = points;
    this.initialTransform = this.board.transform;
  }

  pinchMove(points: Point[]) {
    if (!this.isPinching) {
      this.pinchStart(points);
    }

    var scale = points[0].sub(points[1]).length / this.pinchStartPoints[0].sub(this.pinchStartPoints[1]).length;

    var centerStart = this.pinchStartPoints[0].add(this.pinchStartPoints[1]).mult(0.5);
    var center = points[0].add(points[1]).mult(0.5);

    var diff = center.sub(centerStart.mult(scale));

    var transform = Transform.scale(scale).merge(Transform.translation(diff));

    this.board.transform = this.initialTransform.merge(transform);
    this.renderer.update();
  }

  pinchEnd() {
    this.isPinching = false;
  }

  onMouseMove(ev: MouseEvent) {
    //console.log(`mouse move at ${ev.clientX}, ${ev.clientY}`);
    if (this.isPressed) {
      this.board.strokeTo(new Point(ev.clientX, ev.clientY));
    }
  }
  onMouseDown(ev: MouseEvent) {
    //console.log(`mouse down at ${ev.clientX}, ${ev.clientY}`);
    this.board.beginStroke(new Point(ev.clientX, ev.clientY));
    this.isPressed = true;
  }
  onMouseUp(ev: MouseEvent) {
    //console.log(`mouse up at ${ev.clientX}, ${ev.clientY}`);
    this.isPressed = false;
    this.board.endStroke();
  }

  onTouchMove(ev: TouchEvent) {
    if (this.isPressed) {
      if (ev.touches.length === 1) {
        var touch = ev.touches[0];
        this.board.strokeTo(touchPoint(touch));
      }
      else {
        this.board.cancelStroke();
      }
    }
    if (ev.touches.length === 2) {
      this.pinchMove([0,1].map(i => touchPoint(ev.touches[i])));
    }
    ev.preventDefault();
  }
  onTouchStart(ev: TouchEvent) {
    if (ev.touches.length === 1) {
      var touch = ev.touches[0];
      this.board.beginStroke(touchPoint(touch));
      this.isPressed = true;
    }
    else if (ev.touches.length === 2) {
      this.pinchStart([0,1].map(i => touchPoint(ev.touches[i])));
    }
    ev.preventDefault();
  }
  onTouchEnd(ev: TouchEvent) {
    this.isPressed = false;
    this.board.endStroke();
    this.pinchEnd();
    ev.preventDefault();
  }

  onWheel(ev: WheelEvent) {
    var t = this.board.transform;
    t.dx -= ev.deltaX;
    t.dy -= ev.deltaY;
    this.renderer.update();
    ev.preventDefault();
  }
}

export = CanvasViewController;
