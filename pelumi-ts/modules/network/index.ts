// modules/network/index.ts
import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import { VirtualNetwork, VirtualNetworkArgs } from "./vnet";
import { NetworkConfig } from "../../config";

export interface NetworkModuleArgs {
    environment: string;
    location: pulumi.Input<string>;
    networkConfig: NetworkConfig;
    tags?: { [key: string]: string };
}

export class NetworkModule extends pulumi.ComponentResource {
    public readonly resourceGroup: resources.ResourceGroup;
    public readonly vnet: VirtualNetwork;

    constructor(name: string, args: NetworkModuleArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:module:Network", name, {}, opts);

        // Create a resource group for network resources
        this.resourceGroup = new resources.ResourceGroup(`${args.environment}-network-rg`, {
            location: args.location,
            tags: args.tags,
        }, { parent: this });

        // Create the virtual network and subnets
        this.vnet = new VirtualNetwork(`${args.environment}-vnet`, {
            resourceGroupName: this.resourceGroup.name,
            location: args.location,
            networkConfig: args.networkConfig,
            tags: args.tags,
        }, { parent: this });

        this.registerOutputs({
            resourceGroup: this.resourceGroup,
            vnet: this.vnet,
        });
    }
}

// Export only the classes and interfaces that are actually available
export { VirtualNetwork, VirtualNetworkArgs };