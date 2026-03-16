export const ENV_DEV = 'dev';
export const ENV_STAGING = 'staging';
export const ENV_PROD = 'prod';

export interface EnvConfig {
  account: string;
  region: string;
  stageName: string;
  domainName: string;
  subDomain: string;
  hostedZoneName: string;
  removalPolicy: 'DESTROY' | 'RETAIN';
  autoDeleteObjects: boolean;
  wafRateLimit: number;
}

export const environments: Record<string, EnvConfig> = {
  dev: {
    account: process.env.CDK_DEV_ACCOUNT!,
    region: process.env.AWS_REGION!,
    stageName: ENV_DEV,
    domainName: process.env.DOMAIN_NAME!,
    subDomain: `${ENV_DEV}.${process.env.DOMAIN_NAME!}`,
    hostedZoneName: process.env.DOMAIN_NAME!,
    removalPolicy: 'DESTROY',
    autoDeleteObjects: true,
    wafRateLimit: 1000,
  },
  staging: {
    account: process.env.CDK_STAGING_ACCOUNT!,
    region: process.env.AWS_REGION!,
    stageName: ENV_STAGING,
    domainName: process.env.DOMAIN_NAME!,
    subDomain: `${ENV_STAGING}.${process.env.DOMAIN_NAME!}`,
    hostedZoneName: process.env.DOMAIN_NAME!,
    removalPolicy: 'DESTROY',
    autoDeleteObjects: true,
    wafRateLimit: 1000,
  },
  prod: {
    account: process.env.CDK_PROD_ACCOUNT!,
    region: process.env.AWS_REGION!,
    stageName: ENV_PROD,
    domainName: process.env.DOMAIN_NAME!,
    subDomain: process.env.DOMAIN_NAME!,
    hostedZoneName: process.env.DOMAIN_NAME!,
    removalPolicy: 'RETAIN',
    autoDeleteObjects: false,
    wafRateLimit: 5000,
  },
};