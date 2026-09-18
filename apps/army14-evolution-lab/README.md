# ARMY-14 Evolution Lab

The Evolution Lab is a controlled software-agent experiment harness for EASY and MONY.

It does not promote changes automatically. Every experiment records:
- target project
- soldier
- baseline command
- candidate/mutation label
- pass rate
- failures
- duration
- verdict

Promotion remains fail-closed and requires independent verification.

The Lab is deliberately separated from Elite: Lab discovers and measures candidate changes; Elite may consume only independently verified evidence.
