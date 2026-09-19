# Release gate

The frontier now has a separate release decision boundary.

A verified mutation is **not** automatically a production deployment. Release eligibility requires held-out verification, independent verification, exact baseline/diff evidence, and explicit production authorization.

The gate is fail-closed. It never creates authorization, never treats CI as production evidence, and never claims revenue.

This preserves a hard boundary between:
- repository verification;
- release eligibility;
- authorized production deployment;
- observed production behavior;
- confirmed revenue.
