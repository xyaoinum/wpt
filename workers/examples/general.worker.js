// importScripts() is auto-generated in .any.js tests.
// See AnyWorkerHandler in
// https://github.com/web-platform-tests/wpt/blob/master/tools/serve/serve.py.
importScripts("/resources/testharness.js");

// ============================================================================

// Test body.
test(() => {
    assert_equals(1, 1, "1 == 1");
  },
  "Test that should pass"
);

test(() => {
    // This file is "general.worker.js" and this file itself is the worker
    // top-level script (which is different from the .any.js case).
    assert_equals(location.pathname, "/workers/examples/general.worker.js");
  },
  "Worker top-level script is the .worker.js file itself."
);

// ============================================================================

// done() is auto-generated in .any.js tests.
// See AnyWorkerHandler in
// https://github.com/web-platform-tests/wpt/blob/master/tools/serve/serve.py.
done();
