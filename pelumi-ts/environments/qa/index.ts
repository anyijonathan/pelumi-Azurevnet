// environments/qa/index.ts
import * as pulumi from "@pulumi/pulumi";
import { NetworkModule } from "../../modules/network";
import { Subscription } from "../../modules/subscription";
import { 
    networkConfigs, 
    locations, 
    commonTags,
    resourceGroupPrefix,
    commonSubscriptionId
} from "../../config";

// Environment configuration
const environment = "qa";
const config = new pulumi.Config();

// Create environment-specific tags
const tags = {
    ...commonTags,
    Environment: "QA",
    SubscriptionId: commonSubscriptionId,
};

// Reference existing subscription instead of creating new one
const qaSubscription = new Subscription(`${environment}-subscription`, {
    subscriptionId: commonSubscriptionId,
    tags: tags,
});

// Create QA network infrastructure
const qaNetwork = new NetworkModule(`${environment}-network`, {
    environment,
    location: locations[environment],
    networkConfig: networkConfigs[environment],
    tags,
});

// Export key resources and information
export const subscriptionId = qaSubscription.subscription.id;
export const subscriptionName = qaSubscription.subscription.subscriptionName;
export const vnetId = qaNetwork.vnet.vnet.id;
export const vnetName = qaNetwork.vnet.vnet.name;
export const publicSubnetId = qaNetwork.vnet.publicSubnet.id;
export const privateSubnetId = qaNetwork.vnet.privateSubnet.id;
export const resourceGroupName = qaNetwork.resourceGroup.name;
export const natGatewayPublicIp = qaNetwork.vnet.publicIp.ipAddress;