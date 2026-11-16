# Architecture decisions

- Keep prediction-market price fetching and freshness validation in an isolated edge-function helper so settlement never trusts cached browser or exchange-proxy responses.