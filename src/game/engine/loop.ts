export type GameLoopCallbacks = {
  update: (deltaMs: number) => void;
  render: () => void;
};

export function createGameLoop({ update, render }: GameLoopCallbacks) {
  let frameId = 0;
  let lastTime = 0;
  let running = false;

  const tick = (time: number) => {
    if (!running) {
      return;
    }
    const deltaMs = lastTime ? time - lastTime : 0;
    lastTime = time;
    update(deltaMs);
    render();
    frameId = window.requestAnimationFrame(tick);
  };

  return {
    start() {
      if (running) {
        return;
      }
      running = true;
      lastTime = 0;
      frameId = window.requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      window.cancelAnimationFrame(frameId);
    },
  };
}
