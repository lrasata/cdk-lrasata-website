# cdk-lrasata-website

AWS CDK (TypeScript) project deploying a production-grade static website infrastructure with CloudFront, WAF, ACM, and Route53.

## Architecture

```
                        ┌──────────┐
                        │  Route53 │
                        └────┬─────┘
                             │ A + AAAA alias
                             ▼
┌──────────┐          ┌─────────────┐          ┌─────────────┐
│   WAF    │─────────▶│  CloudFront │─── OAC ──▶│  S3 Bucket  │
│(WebACL)  │          │ Distribution│          │  (private)  │
└──────────┘          └─────────────┘          └─────────────┘
                             │
                      ┌──────┴──────┐
                      │  ACM Cert   │
                      │ (us-east-1) │
                      └─────────────┘
```

- **S3** — Private bucket, no public access. CloudFront OAC is the only entry point.
- **CloudFront** — CDN with HTTPS redirect, SPA error handling (403/404 → index.html), TLS 1.2+.
- **ACM** — DNS-validated certificate, auto-renewed. Must live in `us-east-1` (CloudFront requirement).
- **WAF** — AWS Managed Rules (CommonRuleSet, KnownBadInputs) + per-IP rate limiting.
- **Route53** — A + AAAA alias records pointing to the CloudFront distribution.

## Stack Structure

Three CDK stacks deployed in dependency order:

| Stack | Region | Why |
|---|---|---|
| `CertStack-{stage}` | `us-east-1` | ACM certs for CloudFront must be in us-east-1 |
| `WafStack-{stage}` | `us-east-1` | WAF CLOUDFRONT scope requires us-east-1 |
| `FrontendStack-{stage}` | `eu-central-1` | Main app region |

Cross-region references (cert ARN, WAF ARN) are passed via SSM Parameter Store automatically by CDK.

## Environments

| Stage | Domain | Removal Policy |
|---|---|---|
| `dev` | `dev.yourdomain.com` | DESTROY |
| `staging` | `staging.yourdomain.com` | DESTROY |
| `prod` | `yourdomain.com` | RETAIN |

## Prerequisites

- Node.js 18+
- AWS CLI configured
- A Route53 hosted zone for your domain
- CDK bootstrapped in both `us-east-1` and `eu-central-1`

## Required Environment Variables

Set these in your terminal before running any CDK commands.

On Windows (PowerShell):
```powershell
$env:STAGE="dev"
$env:CDK_DEV_ACCOUNT="123456789012"
$env:CDK_STAGING_ACCOUNT="123456789012"
$env:CDK_PROD_ACCOUNT="123456789012"
$env:AWS_REGION="eu-central-1"
$env:DOMAIN_NAME="yourdomain.com"
```

On Linux/macOS:
```bash
export STAGE=dev
export CDK_DEV_ACCOUNT=123456789012
export CDK_STAGING_ACCOUNT=123456789012
export CDK_PROD_ACCOUNT=123456789012
export AWS_REGION=eu-central-1
export DOMAIN_NAME=yourdomain.com
```

## Setup

**Install dependencies**
```bash
npm install
```

**Bootstrap CDK** (one-time per account/region)
```bash
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/eu-central-1
```

## Deploy

**Synth** (local validation, no AWS changes except hosted zone lookup)
```bash
npx cdk synth
```

**Deploy all stacks for a stage** (CDK resolves dependency order automatically)
```bash
npx cdk deploy FrontendStack-dev
```

**Deploy stacks individually**
```bash
npx cdk deploy CertStack-dev
npx cdk deploy WafStack-dev
npx cdk deploy FrontendStack-dev
```

**Diff before deploying**
```bash
npx cdk diff
```

## Destroy

```bash
npx cdk destroy --all
```

> ⚠️ `prod` stacks use `RETAIN` removal policy — the S3 bucket will not be deleted automatically.

## Project Structure

```
cdk-lrasata-website/
├── bin/
│   └── cdk-lrasata-website.ts   # Entry point, stack wiring
├── lib/
│   ├── config/
│   │   └── environments.ts      # Per-env config (accounts, domains, policies)
│   ├── constructs/
│   │   ├── secure-bucket.ts     # L3: private S3 bucket
│   │   └── cdn-distribution.ts  # L3: CloudFront + OAC + Route53
│   └── stacks/
│       ├── certificate-stack.ts # ACM certificate (us-east-1)
│       ├── waf-stack.ts         # WAF WebACL (us-east-1)
│       └── frontend-stack.ts    # Main stack (eu-central-1)
└── cdk.json
```

## Key CDK Concepts Used

- **L3 Constructs** — `SecureBucket` and `CdnDistribution` encapsulate reusable infrastructure patterns
- **Cross-region references** — `crossRegionReferences: true` enables CDK to pass values between stacks in different regions via SSM
- **Config-driven environments** — one codebase, all env differences expressed in `environments.ts`
- **OAC** — Origin Access Control (modern replacement for OAI) restricts S3 access to CloudFront only