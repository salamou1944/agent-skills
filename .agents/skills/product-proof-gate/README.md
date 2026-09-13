# Product Proof Gate

The repository now distinguishes **implemented skill**, **verified capability**, and **proven product**.

Promotion requires:

`Skill -> Runtime wiring -> Integration tests -> Failure tests -> CI evidence -> Security proof -> Product proof`

If any mandatory evidence is missing, the result is `blocked` or `unverified`; it must never be converted into a success claim by inference.

For CI, a configured `workflow_dispatch` is only configuration evidence. A real run ID and conclusion are required for CI verification.

For providers, configured environment variables are not proof of readiness. The adapter contract must be verified.
