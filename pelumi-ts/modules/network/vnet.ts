// modules/network/vnet.ts
import * as pulumi from "@pulumi/pulumi";
import * as network from "@pulumi/azure-native/network";
import * as resources from "@pulumi/azure-native/resources";
import { NetworkConfig } from "../../config";

// Define the VirtualNetworkArgs interface
export interface VirtualNetworkArgs {
    resourceGroupName: pulumi.Input<string>;
    location: pulumi.Input<string>;
    networkConfig: NetworkConfig;
    tags?: { [key: string]: string };
}

// Define the VirtualNetwork class
export class VirtualNetwork extends pulumi.ComponentResource {
    public readonly vnet: network.VirtualNetwork;
    public readonly publicSubnet: network.Subnet;
    public readonly privateSubnet: network.Subnet;
    public readonly publicNsg: network.NetworkSecurityGroup;
    public readonly privateNsg: network.NetworkSecurityGroup;
    public readonly natGateway: network.NatGateway;
    public readonly publicIp: network.PublicIPAddress;
    public readonly routeTable: network.RouteTable;

    constructor(name: string, args: VirtualNetworkArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:resource:VirtualNetwork", name, {}, opts);

        // Create a virtual network
        this.vnet = new network.VirtualNetwork(args.networkConfig.vnetName, {
            resourceGroupName: args.resourceGroupName,
            location: args.location,
            addressSpace: {
                addressPrefixes: [args.networkConfig.vnetCidr],
            },
            tags: args.tags,
        }, { parent: this });

        // Create NSG for public subnet
        this.publicNsg = new network.NetworkSecurityGroup(`${args.networkConfig.subnets.public.name}-nsg`, {
            resourceGroupName: args.resourceGroupName,
            location: args.location,
            securityRules: [
                {
                    name: "allow-http-inbound",
                    priority: 100,
                    direction: "Inbound",
                    access: "Allow",
                    protocol: "Tcp",
                    sourcePortRange: "*",
                    destinationPortRange: "80",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "*",
                    description: "Allow HTTP traffic",
                },
                {
                    name: "allow-https-inbound",
                    priority: 110,
                    direction: "Inbound",
                    access: "Allow",
                    protocol: "Tcp",
                    sourcePortRange: "*",
                    destinationPortRange: "443",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "*",
                    description: "Allow HTTPS traffic",
                },
                {
                    name: "allow-ssh-inbound",
                    priority: 120,
                    direction: "Inbound",
                    access: "Allow",
                    protocol: "Tcp",
                    sourcePortRange: "*",
                    destinationPortRange: "22",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "*",
                    description: "Allow SSH traffic",
                },
            ],
            tags: args.tags,
        }, { parent: this });

        // Create NSG for private subnet
        this.privateNsg = new network.NetworkSecurityGroup(`${args.networkConfig.subnets.private.name}-nsg`, {
            resourceGroupName: args.resourceGroupName,
            location: args.location,
            securityRules: [
                {
                    name: "allow-internal-inbound",
                    priority: 100,
                    direction: "Inbound",
                    access: "Allow",
                    protocol: "*",
                    sourcePortRange: "*",
                    destinationPortRange: "*",
                    sourceAddressPrefix: args.networkConfig.vnetCidr,
                    destinationAddressPrefix: "*",
                    description: "Allow traffic from within VNet",
                },
                {
                    name: "deny-internet-outbound",
                    priority: 4096,
                    direction: "Outbound",
                    access: "Deny",
                    protocol: "*",
                    sourcePortRange: "*",
                    destinationPortRange: "*",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "Internet",
                    description: "Deny outbound internet access",
                },
            ],
            tags: args.tags,
        }, { parent: this });

        // Create a route table for the private subnet
        this.routeTable = new network.RouteTable(`${name}-private-routes`, {
            resourceGroupName: args.resourceGroupName,
            location: args.location,
            routes: [
                {
                    name: "to-internet-via-firewall",
                    addressPrefix: "0.0.0.0/0",
                    nextHopType: "VirtualAppliance",
                    nextHopIpAddress: "10.0.0.4", 
                }
            ],
            tags: args.tags,
        }, { parent: this });

        // Create public IP for NAT gateway
        this.publicIp = new network.PublicIPAddress(`${name}-nat-ip`, {
            resourceGroupName: args.resourceGroupName,
            location: args.location,
            publicIPAllocationMethod: "Static",
            sku: {
                name: "Standard",
                tier: "Regional",
            },
            tags: args.tags,
        }, { parent: this });

        // Create NAT Gateway
        this.natGateway = new network.NatGateway(`${name}-nat-gateway`, {
            resourceGroupName: args.resourceGroupName,
            location: args.location,
            publicIpAddresses: [{
                id: this.publicIp.id,
            }],
            tags: args.tags,
        }, { parent: this });

        // Create public subnet directly
        this.publicSubnet = new network.Subnet(args.networkConfig.subnets.public.name, {
            resourceGroupName: args.resourceGroupName,
            virtualNetworkName: this.vnet.name,
            addressPrefix: args.networkConfig.subnets.public.cidr,
            natGateway: {
                id: this.natGateway.id,
            },
            networkSecurityGroup: {
                id: this.publicNsg.id,
            },
            serviceEndpoints: [
                {
                    service: "Microsoft.Web",
                    locations: ["*"],
                },
                {
                    service: "Microsoft.AzureActiveDirectory",
                    locations: ["*"],
                },
            ],
        }, { 
            parent: this,
            dependsOn: [this.vnet, this.publicNsg, this.natGateway],
        });

        // Log a message when the public subnet is created
        this.publicSubnet.id.apply(id => {
            console.log(`Public subnet created with ID: ${id}`);
            return id;
        });

        // Create private subnet directly - with fixed dependency structure
        this.privateSubnet = new network.Subnet(args.networkConfig.subnets.private.name, {
            resourceGroupName: args.resourceGroupName,
            virtualNetworkName: this.vnet.name,
            addressPrefix: args.networkConfig.subnets.private.cidr,
            networkSecurityGroup: {
                id: this.privateNsg.id,
            },
            routeTable: {
                id: this.routeTable.id,
            },
            serviceEndpoints: [
                {
                    service: "Microsoft.Sql",
                    locations: ["*"],
                },
                {
                    service: "Microsoft.Storage",
                    locations: ["*"],
                },
                {
                    service: "Microsoft.KeyVault",
                    locations: ["*"],
                },
            ],
            privateEndpointNetworkPolicies: "Disabled",
        }, { 
            parent: this,
            // Set the proper dependencies, but avoid circular dependencies
            dependsOn: [this.vnet, this.privateNsg, this.routeTable, this.publicSubnet],
        });

        // Add logging to help with debugging
        console.log(`Creating VNet: ${args.networkConfig.vnetName} with CIDR: ${args.networkConfig.vnetCidr}`);
        console.log(`Creating public subnet: ${args.networkConfig.subnets.public.name} with CIDR: ${args.networkConfig.subnets.public.cidr}`);
        console.log(`Creating private subnet: ${args.networkConfig.subnets.private.name} with CIDR: ${args.networkConfig.subnets.private.cidr}`);

        this.registerOutputs({
            vnet: this.vnet,
            publicSubnet: this.publicSubnet,
            privateSubnet: this.privateSubnet,
            publicNsg: this.publicNsg,
            privateNsg: this.privateNsg,
            natGateway: this.natGateway,
            publicIp: this.publicIp,
            routeTable: this.routeTable,
        });
    }
}