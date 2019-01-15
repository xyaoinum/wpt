let service = (async function() {
  let load = Promise.resolve();
  [
    '/resources/chromium/mojo_bindings.js',
    '/resources/chromium/string16.mojom.js',
    '/resources/chromium/idle_manager.mojom.js',
  ].forEach(path => {
    let script = document.createElement('script');
    script.src = path;
    script.async = false;
    load = load.then(() => new Promise(resolve => {
      script.onload = resolve;
    }));
    document.head.appendChild(script);
  });

  return load.then(intercept);
})();

class FakeIdleMonitor {
  addMonitor(threshold, monitorPtr, callback) {
    return this.handler.addMonitor(threshold, monitorPtr);
  }
  setHandler(handler) {
    this.handler = handler;
    return this;
  }
  setBinding(binding) {
    this.binding = binding;
    return this;
  }
  close() {
    this.binding.close();
  }
}

function intercept() {
  let result = new FakeIdleMonitor();

  let binding = new mojo.Binding(blink.mojom.IdleManager, result);
  let interceptor = new MojoInterfaceInterceptor(blink.mojom.IdleManager.name);
  interceptor.oninterfacerequest = (e) => {
    binding.bind(e.handle);
  }

  interceptor.start();

  result.setBinding(binding);
  return result;
}

promise_test(async t => {
  let interceptor = await service;

  interceptor.setHandler({
    addMonitor(threshold, monitorPtr) {
      return Promise.resolve({state: blink.mojom.IdleState.ACTIVE});
    }
  });

  let status = await navigator.idle.query({threshold: 10});

  assert_equals(status.state, "active");

}, 'query()');

promise_test(async t => {
  let interceptor = await service;

  interceptor.setHandler({
    addMonitor(threshold, monitorPtr) {
      t.step_timeout(() => {
        monitorPtr.update(blink.mojom.IdleState.IDLE);
      }, 0);
      return Promise.resolve({state: blink.mojom.IdleState.ACTIVE});
    }
  });

  let monitor = await navigator.idle.query({threshold: 10});

  await new EventWatcher(t, monitor, ["change"]).wait_for("change");

  assert_equals(monitor.state, "idle");
}, 'updates once');


promise_test(async t => {
  let interceptor = await service;

  interceptor.setHandler({
    addMonitor(threshold, monitorPtr) {
      // Updates the client once with the user idle.
      t.step_timeout(() => {
        monitorPtr.update(blink.mojom.IdleState.IDLE);
      }, 0);
      // Updates the client a second time with the user active.
      t.step_timeout(() => {
        monitorPtr.update(blink.mojom.IdleState.ACTIVE);
      }, 1);
      return Promise.resolve({state: blink.mojom.IdleState.ACTIVE});
    }
  });

  let monitor = await navigator.idle.query({threshold: 10});

  let watcher = new EventWatcher(t, monitor, ["change"]);

  // waits for the first event.
  await watcher.wait_for("change");
  assert_equals(monitor.state, "idle");

  // waits for the second event.
  await watcher.wait_for("change");
  assert_equals(monitor.state, "active");
}, 'updates twice');

promise_test(async t => {
  let interceptor = await service;

  interceptor.setHandler({
    addMonitor(threshold, monitorPtr) {
      return Promise.resolve({state: blink.mojom.IdleState.LOCKED});
    }
  });

  let monitor = await navigator.idle.query({threshold: 10});

  assert_equals(monitor.state, "locked");
}, 'locked screen');

promise_test(async t => {
  let interceptor = await service;

  interceptor.setHandler({
    addMonitor(threshold, monitorPtr) {
      return new Promise(function(resolve, reject) {
        // leave the renderer deliberately hanging by not resolve()-ing.
      });
    }
  });

  let error = new Promise(function(resolve, reject) {
    navigator.idle.query({threshold: 10})
      .then((e) => {reject("unexpected response :(")})
      .catch((e) => {resolve(e.message)});
  });

  // simulates what happens when the service is unavailable.
  interceptor.close();

  assert_equals(await error, "Idle detection not available");

}, "service unavailable");