# Integrations

## Purpose

Explain what third-party services this Next.js project depends on.

## Active Integrations

| Name | Type | Required | Loaded Where | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| _Example CMS_ | CMS | Yes | Server | Content | Replace with real integrations |
| _GTM_ | Analytics | Yes | Client | Analytics | Loaded globally |

## Load Order

1. Consent manager
2. Analytics container
3. Personalization scripts
4. Chatbot scripts

## Change Rules

Any new third-party integration must include:

- Entry in `architecture.config.json`
- Documentation in this file
- ADR if it changes runtime, privacy, performance, security, data flow, or deployment
