'use strict';

function registerPassthroughAnimator() {
  return runInAnimationWorklet(`
    registerAnimator('passthrough', class {
      animate(currentTime, effect) { effect.localTime = currentTime; }
    });
  `);
}

function registerConstantTimeAnimator(localTime) {
  return runInAnimationWorklet(`
    registerAnimator('constant_time', class {
      animate(currentTime, effect) { effect.localTime = ${localTime}; }
    });
  `);
}


function runInAnimationWorklet(code) {
  return CSS.animationWorklet.addModule(
    URL.createObjectURL(new Blob([code], {type: 'text/javascript'}))
  );
}

