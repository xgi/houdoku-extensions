import { app } from "electron";

before(async () => {
  await app.whenReady();
});
