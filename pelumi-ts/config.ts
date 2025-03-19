// config.ts
import * as pulumi from "@pulumi/pulumi";

// Environment type definition
export type Environment = "dev" | "qa" | "prod";

// Network configuration interface
export interface NetworkConfig {
    vnetName: string;
    vnetCidr: string;
    subnets: {
        public: {
            name: string;
            cidr: string;
        };
        private: {
            name: string;
            cidr: string;
        };
    };
}

// Subscription configuration interface
export interface SubscriptionConfig {
    name: string;
    billingScope: string;
    tags: { [key: string]: string };
}

// Configuration for each environment
export const networkConfigs: Record<Environment, NetworkConfig> = {
    dev: {
        vnetName: "dev-vnet",
        vnetCidr: "10.100.0.0/16", // Using 10.100.x.x range for dev
        subnets: {
            public: {
                name: "dev-public-subnet",
                cidr: "10.100.0.0/24", // 254 usable IPs
            },
            private: {
                name: "dev-private-subnet",
                cidr: "10.100.1.0/24", // 254 usable IPs
            },
        },
    },
    qa: {
        vnetName: "qa-vnet",
        vnetCidr: "10.101.0.0/16", // Using 10.101.x.x range for qa
        subnets: {
            public: {
                name: "qa-public-subnet",
                cidr: "10.101.0.0/24", // 254 usable IPs
            },
            private: {
                name: "qa-private-subnet",
                cidr: "10.101.1.0/24", // 254 usable IPs
            },
        },
    },
    prod: {
        vnetName: "prod-vnet",
        vnetCidr: "10.102.0.0/16", // Using 10.102.x.x range for prod
        subnets: {
            public: {
                name: "prod-public-subnet",
                cidr: "10.102.0.0/24", // 254 usable IPs
            },
            private: {
                name: "prod-private-subnet",
                cidr: "10.102.1.0/24", // 254 usable IPs
            },
        },
    },
};

// Subscription configurations
export const commonSubscriptionId = "da9faafd-3af5-47ae-b6e6-ba7e78eb71b8";

// Common tags for all resources
export const commonTags = {
    ManagedBy: "Pulumi",
    Project: "Access-ARM",
};

// Azure locations for each environment
export const locations: Record<Environment, string> = {
    dev: "Central US",
    qa: "Central US",
    prod: "Central US", // Primary production region
};

// Resource group name prefix for each environment
export const resourceGroupPrefix: Record<Environment, string> = {
    dev: "access-arm-dev",
    qa: "access-arm-qa",
    prod: "access-arm-prod",
};