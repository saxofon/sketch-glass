import Variable from "../lib/rx/Variable";
import ObservableArray from "../lib/rx/ObservableArray";
import User from "../model/User";
import Canvas from "../model/Canvas";
import CanvasFile from "../model/CanvasFile";
import CanvasViewModel from "./CanvasViewModel";
import * as Auth from "../Auth";
import * as GoogleAPI from "../lib/GoogleAPI";

export default
class AppViewModel {
  user = new Variable<User>(User.empty());
  files = new ObservableArray<CanvasFile>();
  currentFile = new Variable<CanvasFile | undefined>(undefined);
  canvasViewModel = new Variable<CanvasViewModel | undefined>(undefined);
  isAuthenticated = new Variable(false);
  isLoginNeeded = new Variable(false);

  async initData() {
    await Promise.all([
      this.fetchUser(),
      this.fetchFiles()
    ]);
    if (this.files.length > 0) {
      this.currentFile.value = this.files.values[0];
    }
  }

  async fetchUser() {
    this.user.value = await User.current();
  }

  async fetchFiles() {
    this.files.values = await CanvasFile.list();
  }

  async addFile() {
    const file = await CanvasFile.create();
    this.files.unshift(file);
  }

  async checkAuth() {
    if (await Auth.check()) {
      this.isAuthenticated.value = true;
    } else {
      this.isLoginNeeded.value = true;
    }
  }

  async logIn() {
    await Auth.popup();
    this.isAuthenticated.value = true;
  }

  async init() {
    this.isAuthenticated.observable.filter(a => a).subscribe(() => {
      this.initData();
    });

    this.currentFile.observable.subscribe(async (file) => {
      this.canvasViewModel.value = undefined;
      if (file == undefined) { return; }
      const canvas = await Canvas.fromFile(file);
      this.canvasViewModel.value = new CanvasViewModel(canvas);
    });

    await GoogleAPI.init();
    await GoogleAPI.load("auth:client,drive-realtime");
    await this.checkAuth();
  }

  constructor() {
    this.init();
  }
}

export const appViewModel = new AppViewModel();
