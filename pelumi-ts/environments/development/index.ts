// environments/development/index.ts
import * as pulumi from "@pulumi/pulumi";
import { NetworkModule } from "../../modules/network";
import { 
    networkConfigs, 
    locations, 
    commonTags,
    resourceGroupPrefix,
    commonSubscriptionId
} from "../../config";

// Environment configuration
const environment = "dev";
const config = new pulumi.Config();

// Create environment-specific tags
const tags = {
    ...commonTags,
    Environment: "Development",
    SubscriptionId: commonSubscriptionId,
};

// Create development network infrastructure
const devNetwork = new NetworkModule(`${environment}-network`, {
    environment,
    location: locations[environment],
    networkConfig: networkConfigs[environment],
    tags,
});

// Export key resources and information
export const subscriptionId = commonSubscriptionId;
export const vnetId = devNetwork.vnet.vnet.id;
export const vnetName = devNetwork.vnet.vnet.name;
export const publicSubnetId = devNetwork.vnet.publicSubnet.id;
export const privateSubnetId = devNetwork.vnet.privateSubnet.id;
export const resourceGroupName = devNetwork.resourceGroup.name;
export const natGatewayPublicIp = devNetwork.vnet.publicIp.ipAddress;