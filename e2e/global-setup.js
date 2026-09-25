import { ensurePhotos } from "./photos.js";

export default async function globalSetup() {
  await ensurePhotos();
}
