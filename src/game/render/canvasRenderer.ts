export function renderStartupScene(canvas: HTMLCanvasElement, devicePixelRatio: number): void {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * devicePixelRatio);
  canvas.height = Math.floor(rect.height * devicePixelRatio);

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.scale(devicePixelRatio, devicePixelRatio);
  context.clearRect(0, 0, rect.width, rect.height);
  context.fillStyle = "rgba(255, 255, 255, 0.16)";
  context.fillRect(0, 0, rect.width, rect.height);
}
