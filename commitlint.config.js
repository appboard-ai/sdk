// Conventional Commits enforcement.
// Format: type(scope): Subject
// Allowed types come from @commitlint/config-conventional (feat, fix, refactor,
// chore, docs, test, build, perf, style, ci, revert).
// Scopes are intentionally not whitelisted — pick what reads naturally for the
// area you're touching (core, build, examples, init, ...).
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Default config-conventional forces lowercase subjects. Allow sentence-case
    // (e.g. "Initialize browser SDK") while still rejecting Title Case, ALL
    // CAPS, and PascalCase.
    "subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]],
  },
};
