import Transform from '../lib/geometry/Transform';
import Variable from "../lib/rx/Variable";
import CanvasFile from "../model/CanvasFile";
import User from "../model/User";
import * as Auth from "../Auth";

declare module gapi.drive.share {
  export var ShareClient: any;
}

export default
class CanvasFileViewModel {
  file: Variable<CanvasFile>;
  users = new Variable<User[]>([]);

  constructor(file: CanvasFile) {
    this.file = new Variable(file);
    this.fetchUsers();
  }

  dispose() {
  }

  async openShareDialog() {
    const shareClient = new gapi.drive.share.ShareClient();
    shareClient.setOAuthToken(Auth.accessToken);
    shareClient.setItemIds([this.file.value.id]);
    shareClient.showSettingsDialog();
  }

  async fetchUsers() {
    this.users.value = await this.file.value.fetchUsers();
  }
}