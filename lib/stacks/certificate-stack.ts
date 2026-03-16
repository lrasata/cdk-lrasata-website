import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { EnvConfig } from '../config/environments';

interface CertificateStackProps extends StackProps {
    config: EnvConfig;
}

export class CertificateStack extends Stack {
    public readonly certificate: acm.Certificate;

    constructor(scope: Construct, id: string, props: CertificateStackProps) {
        super(scope, id, props);

        const { config } = props;

        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: config.hostedZoneName,
        });

        this.certificate = new acm.Certificate(this, 'Certificate', {
            domainName: config.subDomain,
            validation: acm.CertificateValidation.fromDns(hostedZone),
        });
    }
}