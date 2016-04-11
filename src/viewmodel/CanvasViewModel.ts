import Stroke from '../model/Stroke';
import Point from '../lib/geometry/Point';
import Color from '../lib/geometry/Color';
import Transform from '../lib/geometry/Transform';
import Variable from "../lib/rx/Variable";
import * as Rx from "rx";

export default
class CanvasViewModel {
  transform = new Variable(Transform.identity());
  strokeWidth = new Variable(3);
  strokeColor = new Variable(new Color(0,0,0,1));
  strokes: Stroke[] = [];
  strokeAdded = new Rx.Subject<Stroke>();
  updateNeeded = new Rx.Subject<void>();

  addStroke(stroke: Stroke) {
    this.strokes.push(stroke);
    this.strokeAdded.onNext(stroke);
  }
  
  requestUpdate() {
    this.updateNeeded.onNext(undefined);
  }
}
