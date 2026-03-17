import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { SecureBucket } from '../constructs/secure-bucket';
import { CdnDistribution } from '../constructs/cdn-distribution';
import { EnvConfig } from '../config/environments';


interface FrontendStackProps extends StackProps {
    config: EnvConfig;
    certificate: acm.Certificate;
    webAclArn: string;
}

export class FrontendStack extends Stack {
    constructor(scope: Construct, id: string, props: FrontendStackProps) {
        super(scope, id, props);

        const { bucket } = new SecureBucket(this, 'StaticAssets', {
            config: props.config,
        });

        const { distribution } = new CdnDistribution(this, 'CDN', {
            config: props.config,
            bucket,
            certificate: props.certificate,
            webAclArn: props.webAclArn,
        });

        new CfnOutput(this, 'BucketName', {
            value: bucket.bucketName,
        });

        new CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
        });

        new CfnOutput(this, 'SiteUrl', {
            value: `https://${props.config.subDomain}`,
        });
    }
}