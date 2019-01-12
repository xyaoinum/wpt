// META: global=!default,worker

// Test body.
// The result for each test and its assertion failure messages are reported
// in the test result.
test(() => {
    assert_equals(1, 1, "1 == 1");
  },
  "Test that should pass"
);

test(() => {
    assert_equals(1, 2, "1 == 2");
  },
  "Test that should fail"
);
