import { createApp } from "./app.js";

const performOcr = async ({ imageBase64 }: { imageBase64: string }) => ({
  text: `[placeholder] bytes=${imageBase64.length}`,
});

const port = Number(process.env.PORT ?? 8080);
createApp(performOcr).listen(port, () => console.log("listening", port));
