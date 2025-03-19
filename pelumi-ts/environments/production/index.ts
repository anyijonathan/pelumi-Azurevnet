// environments/production/index.ts
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
const environment = "prod";
const config = new pulumi.Config();

// Create environment-specific tags
const tags = {
    ...commonTags,
    Environment: "Production",
    SubscriptionId: commonSubscriptionId,
    CostCenter: "Production-IT",
    Criticality: "High",
};

// Reference existing subscription instead of creating new one
const prodSubscription = new Subscription(`${environment}-subscription`, {
    subscriptionId: commonSubscriptionId,
    tags: tags,
});

// Create production network infrastructure
const prodNetwork = new NetworkModule(`${environment}-network`, {
    environment,
    location: locations[environment],
    networkConfig: networkConfigs[environment],
    tags,
});

// Export key resources and information
export const subscriptionId = prodSubscription.subscription.id;
export const subscriptionName = prodSubscription.subscription.subscriptionName;
export const vnetId = prodNetwork.vnet.vnet.id;
export const vnetName = prodNetwork.vnet.vnet.name;
export const publicSubnetId = prodNetwork.vnet.publicSubnet.id;
export const privateSubnetId = prodNetwork.vnet.privateSubnet.id;
export const resourceGroupName = prodNetwork.resourceGroup.name;
export const natGatewayPublicIp = prodNetwork.vnet.publicIp.ipAddress;