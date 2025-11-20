import failOnConsole from "vitest-fail-on-console";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- something wonky is going on with this rule here.
failOnConsole({
  shouldFailOnWarn: false,
});
