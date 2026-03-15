const path = require("node:path");
const fs = require("node:fs");
const { getDefaultConfig } = require("expo/metro-config");
const { resolve } = require("metro-resolver");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const projectNodeModules = path.resolve(projectRoot, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");
const config = getDefaultConfig(projectRoot);

function resolveModuleFromProjectOrWorkspace(moduleName) {
  const projectModulePath = path.resolve(projectRoot, "node_modules", moduleName);
  if (fs.existsSync(projectModulePath)) {
    return projectModulePath;
  }

  return path.resolve(workspaceRoot, "node_modules", moduleName);
}

config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), workspaceRoot]));
config.resolver.nodeModulesPaths = [projectNodeModules, workspaceNodeModules];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: resolveModuleFromProjectOrWorkspace("react"),
  "react-native": resolveModuleFromProjectOrWorkspace("react-native"),
};

const sourceExtensions = ["ts", "tsx", "js", "jsx", "json"];

function resolveAliasedModulePath(moduleName) {
  const basePath = path.join(projectRoot, moduleName.slice(2));
  const candidates = [
    ...sourceExtensions.map((extension) => `${basePath}.${extension}`),
    ...sourceExtensions.map((extension) => path.join(basePath, `index.${extension}`)),
  ];

  return candidates.find((candidatePath) => fs.existsSync(candidatePath)) ?? null;
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const aliasedPath = resolveAliasedModulePath(moduleName);
    if (aliasedPath) {
      return {
        filePath: aliasedPath,
        type: "sourceFile",
      };
    }
  }

  return resolve(context, moduleName, platform);
};

module.exports = config;
