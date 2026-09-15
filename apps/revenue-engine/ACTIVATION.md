# Revenue Engine activation

The Revenue Engine is operational in deterministic dry-run mode and is designed to activate provider-by-provider without changing its core.

## Local operator

```bash
npm run revenue:doctor
npm run revenue:demo
npm run revenue:serve
```

The API listens on `127.0.0.1:8787` by default. Set `REVENUE_ENGINE_PORT` to change the local port.

## Production activation

Provider credentials must be supplied through the deployment secret manager. Never commit credentials.

Supported capability slots:

- `REVENUE_DISCOVERY_PROVIDER`
- `REVENUE_AFFILIATE_PROVIDER`
- `REVENUE_PUBLISH_PROVIDER`
- `REVENUE_BILLING_PROVIDER`
- `REVENUE_ANALYTICS_PROVIDER`

A provider is not considered live merely because its variable exists. Its adapter must satisfy the provider/adapter contract, have explicit failure behavior, and pass an integration test before promotion.

## Revenue truth

Only provider-confirmed events enter the revenue ledger. Credits, clicks, impressions, simulated executions, or referral URLs alone are never counted as cash.

## Operating loop

`discover -> verify -> score -> route -> package -> publish -> measure -> learn`

The system can remain useful before external providers are configured: it can discover, verify, score, plan, and fan out opportunities without fabricating execution or revenue.
