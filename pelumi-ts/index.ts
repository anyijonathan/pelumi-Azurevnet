import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as azure_native from "@pulumi/azure-native";

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("Access-ARM-Dev");

// Create an Azure resource (Storage Account)
const storageAccount = new storage.StorageAccount("sa", {
    resourceGroupName: resourceGroup.name,
    sku: {
        name: storage.SkuName.Standard_LRS,
    },
    kind: storage.Kind.StorageV2,
});

// Export the primary key of the Storage Account
const storageAccountKeys = storage.listStorageAccountKeysOutput({
    resourceGroupName: resourceGroup.name,
    accountName: storageAccount.name
});

// Create V-Net and subnet

const virtualNetwork = new azure_native.network.VirtualNetwork("virtualNetwork", {
    addressSpace: {
        addressPrefixes: ["10.0.0.0/16"],
    },
    location: "Central US",
    resourceGroupName: resourceGroup.name,
    subnets: [{
        addressPrefix: "10.0.0.0/24",
        name: "public-subnet",
    }],
    virtualNetworkName: "Dev-vnet",
});

//export const storageAccountName = storageAccount.name;
export const resourceGroupName = resourceGroup.name;
export const primaryStorageKey = storageAccountKeys.keys[0].value;
