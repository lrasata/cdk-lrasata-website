import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { EnvConfig, ENV_PROD } from '../config/environments';

interface CdnDistributionProps {
    config: EnvConfig;
    bucket: s3.Bucket;
    certificate: acm.Certificate;
    webAclArn: string;
}

export class CdnDistribution extends Construct {
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props: CdnDistributionProps) {
        super(scope, id);

        const { config, bucket, certificate, webAclArn } = props;

        const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
            description: `OAC for frontend-${config.stageName}`,
        });

        this.distribution = new cloudfront.Distribution(this, 'Distribution', {
            domainNames: [config.subDomain],
            certificate,
            webAclId: webAclArn,
            defaultRootObject: 'index.html',
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            priceClass:
                config.stageName === ENV_PROD
                    ? cloudfront.PriceClass.PRICE_CLASS_ALL
                    : cloudfront.PriceClass.PRICE_CLASS_100,
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, {
                    originAccessControl: oac,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                compress: true,
            },
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
            ],
        });

        // Allow CloudFront OAC to read from the bucket
        bucket.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['s3:GetObject'],
                principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
                resources: [`${bucket.bucketArn}/*`],
                conditions: {
                    StringEquals: {
                        'AWS:SourceArn': `arn:aws:cloudfront::${config.account}:distribution/${this.distribution.distributionId}`,
                    },
                },
            })
        );

        // Route53 records
        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: config.hostedZoneName,
        });

        new route53.ARecord(this, 'AliasRecord', {
            zone: hostedZone,
            recordName: config.subDomain,
            target: route53.RecordTarget.fromAlias(
                new targets.CloudFrontTarget(this.distribution)
            ),
        });

        new route53.AaaaRecord(this, 'AaaaRecord', {
            zone: hostedZone,
            recordName: config.subDomain,
            target: route53.RecordTarget.fromAlias(
                new targets.CloudFrontTarget(this.distribution)
            ),
        });
    }
}