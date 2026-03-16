import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { EnvConfig } from '../config/environments';

interface WafStackProps extends StackProps {
    config: EnvConfig;
}

export class WafStack extends Stack {
    public readonly webAclArn: string;

    constructor(scope: Construct, id: string, props: WafStackProps) {
        super(scope, id, props);

        const { config } = props;

        const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
            name: `frontend-waf-${config.stageName}`,
            scope: 'CLOUDFRONT',
            defaultAction: { allow: {} },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: `frontend-waf-${config.stageName}`,
                sampledRequestsEnabled: true,
            },
            rules: [
                {
                    name: 'AWSManagedRulesCommonRuleSet',
                    priority: 1,
                    overrideAction: { none: {} },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'CommonRuleSet',
                        sampledRequestsEnabled: true,
                    },
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesCommonRuleSet',
                        },
                    },
                },
                {
                    name: 'RateLimitRule',
                    priority: 2,
                    action: { block: {} },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'RateLimit',
                        sampledRequestsEnabled: true,
                    },
                    statement: {
                        rateBasedStatement: {
                            limit: config.wafRateLimit,
                            aggregateKeyType: 'IP',
                        },
                    },
                },
            ],
        });

        this.webAclArn = webAcl.attrArn;
    }
}