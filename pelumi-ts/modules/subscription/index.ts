// modules/subscription/index.ts
import * as pulumi from "@pulumi/pulumi";

export interface SubscriptionArgs {
    subscriptionId: string;
    tags?: { [key: string]: string };
}

export class Subscription extends pulumi.ComponentResource {
    public readonly subscription: {
        id: string;
        subscriptionName: string;
    };

    constructor(name: string, args: SubscriptionArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:resource:Subscription", name, {}, opts);

        // Instead of creating a new subscription, we're just referencing the existing one
        this.subscription = {
            id: args.subscriptionId,
            subscriptionName: name.replace('-subscription', ''), // Using the name part as display name
        };

        this.registerOutputs({
            subscription: this.subscription,
        });
    }
}