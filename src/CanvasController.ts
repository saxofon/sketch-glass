/// <reference path="../typings/bundle.d.ts" />
'use strict';

import Renderer = require('./Renderer');
import Stroke = require('./Stroke');
import Point = require('./Point');
import Color = require('./Color');
import Transform = require('./Transform');
import _ = require('lodash');

function touchPoint(touch: Touch) {
  return new Point(touch.clientX, touch.clientY);
}

enum InteractionState {
  None, Pressed, Pinching
}

class CanvasController {

  element: HTMLElement;

  renderer: Renderer;
  currentStrokeRenderer: Renderer;

  interactionState = InteractionState.None;
  pinchStartPoints: Point[];

  transform = Transform.identity();
  initialTransform = Transform.identity();

  currentStroke: Stroke;
  isStroking = false;
  strokeWidth = 4;
  strokeColor = new Color(0,0,0,1);

  constructor() {

    this.renderer = new Renderer({tiled: false});
    this.currentStrokeRenderer = new Renderer({tiled: true});

    var elem = this.element = document.createElement('div');
    elem.className = 'canvas-area';
    elem.appendChild(this.renderer.element);
    elem.appendChild(this.currentStrokeRenderer.element);

    elem.addEventListener('mousemove', this.onMouseMove.bind(this));
    elem.addEventListener('mousedown', this.onMouseDown.bind(this));
    elem.addEventListener('mouseup', this.onMouseUp.bind(this));

    elem.addEventListener('touchmove', this.onTouchMove.bind(this));
    elem.addEventListener('touchstart', this.onTouchStart.bind(this));
    elem.addEventListener('touchend', this.onTouchEnd.bind(this));

    elem.addEventListener('wheel', this.onWheel.bind(this));
  }

  pinchStart(points: Point[]) {
    this.interactionState = InteractionState.Pinching;
    this.pinchStartPoints = points;
    this.initialTransform = this.transform;
  }

  pinchMove(points: Point[]) {
    if (this.interactionState !== InteractionState.Pinching) {
      this.pinchStart(points);
    }

    var scale = points[0].sub(points[1]).length / this.pinchStartPoints[0].sub(this.pinchStartPoints[1]).length;

    var centerStart = this.pinchStartPoints[0].add(this.pinchStartPoints[1]).mul(0.5);
    var center = points[0].add(points[1]).mul(0.5);

    var diff = center.sub(centerStart.mul(scale));

    var transform = Transform.scale(scale).merge(Transform.translation(diff));

    var transform = this.initialTransform.merge(transform);
    this.updateTransform(transform);
    this.renderer.update();
  }

  pinchEnd() {
    this.interactionState = InteractionState.None;
  }

  pressStart(pos: Point) {
    this.interactionState = InteractionState.Pressed;

    pos = pos.transform(this.transform.invert());
    var stroke = this.currentStroke = new Stroke();
    stroke.width = this.strokeWidth;
    stroke.color = this.strokeColor;
    stroke.addPoint(pos);

    this.currentStrokeRenderer.strokes = [stroke];
  }

  pressMove(pos: Point) {
    if (this.interactionState === InteractionState.Pressed) {
      pos = pos.transform(this.transform.invert());

      var stroke = this.currentStroke;
      var renderer = this.currentStrokeRenderer;

      renderer.addDirtyRect(stroke.unfinalizedBoundingRect);
      stroke.addPoint(pos);
      renderer.addDirtyRect(stroke.unfinalizedBoundingRect);
      renderer.update();
    }
  }

  pressEnd() {
    if (this.interactionState === InteractionState.Pressed) {
      this.renderer.strokes.push(this.currentStroke);

      process.nextTick(() => {
        this.renderer.drawOther(this.currentStrokeRenderer);
        this.currentStrokeRenderer.strokes = [];
        this.currentStrokeRenderer.dirtyWhole();
        this.currentStrokeRenderer.clear();
      });

      this.interactionState = InteractionState.None;
    }
  }

  updateTransform(transform: Transform) {
    this.transform = transform;
    this.renderer.transform = transform;
    this.currentStrokeRenderer.transform = transform;
  }

  onMouseMove(ev: MouseEvent) {
    //console.log(`mouse move at ${ev.clientX}, ${ev.clientY}`);
    this.pressMove(new Point(ev.clientX, ev.clientY));
  }
  onMouseDown(ev: MouseEvent) {
    //console.log(`mouse down at ${ev.clientX}, ${ev.clientY}`);
    this.pressStart(new Point(ev.clientX, ev.clientY));
  }
  onMouseUp(ev: MouseEvent) {
    //console.log(`mouse up at ${ev.clientX}, ${ev.clientY}`);
    this.pressEnd();
  }

  onTouchMove(ev: TouchEvent) {
    if (ev.touches.length === 1) {
      var touch = ev.touches[0];
      this.pressMove(touchPoint(touch));
    }
    else if (ev.touches.length === 2) {
      this.pinchMove([0,1].map(i => touchPoint(ev.touches[i])));
    }
    ev.preventDefault();
  }
  onTouchStart(ev: TouchEvent) {
    if (ev.touches.length === 1) {
      var touch = ev.touches[0];
      this.pressStart(touchPoint(touch));
    }
    else if (ev.touches.length === 2) {
      this.pinchStart([0,1].map(i => touchPoint(ev.touches[i])));
    }
    ev.preventDefault();
  }
  onTouchEnd(ev: TouchEvent) {
    this.pressEnd();
    this.pinchEnd();
    ev.preventDefault();
  }

  onWheel(ev: WheelEvent) {
    var transform = this.transform.translate(new Point(-ev.deltaX, -ev.deltaY));
    this.updateTransform(transform);
    this.renderer.update();
    ev.preventDefault();
  }
}

export = CanvasController;