#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CertificateStack } from '../lib/stacks/certificate-stack';
import { WafStack } from '../lib/stacks/waf-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { ENV_DEV, environments } from '../lib/config/environments';

const app = new App();

const stage = process.env.STAGE ?? ENV_DEV;
const config = environments[stage];

if (!config) {
    throw new Error(`Unknown STAGE: "${stage}". Valid: ${Object.keys(environments).join(', ')}`);
}

const certStack = new CertificateStack(app, `CertStack-${stage}`, {
    env: { account: config.account, region: 'us-east-1' },
    config,
    crossRegionReferences: true,
});

const wafStack = new WafStack(app, `WafStack-${stage}`, {
    env: { account: config.account, region: 'us-east-1' },
    config,
    crossRegionReferences: true,
});

new FrontendStack(app, `FrontendStack-${stage}`, {
    env: { account: config.account, region: config.region },
    config,
    certificate: certStack.certificate,
    webAclArn: wafStack.webAclArn,
    crossRegionReferences: true,
});