import Disposable from "./Disposable";

export default
class DisposableBag implements Disposable {
  disposables = new Set<Disposable>();

  add(...disposables: Disposable[]) {
    for (const d of disposables) {
      this.disposables.add(d);
    }
  }

  delete(...disposables: Disposable[]) {
    for (const d of disposables) {
      this.disposables.delete(d);
    }
  }

  dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
