import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import {ENV_PROD, EnvConfig} from '../config/environments';

interface SecureBucketProps {
    config: EnvConfig;
}

export class SecureBucket extends Construct {
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: SecureBucketProps) {
        super(scope, id);

        const { config } = props;

        this.bucket = new s3.Bucket(this, 'Bucket', {
            bucketName: `frontend-${config.stageName}-${config.account}`,
            versioned: config.stageName === ENV_PROD,
            removalPolicy: RemovalPolicy[config.removalPolicy],
            autoDeleteObjects: config.autoDeleteObjects,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            publicReadAccess: false,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
        });
    }
}