const path = require("node:path");
const fs = require("node:fs");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

function resolveModuleFromProjectOrWorkspace(moduleName) {
  const projectModulePath = path.resolve(projectRoot, "node_modules", moduleName);
  if (fs.existsSync(projectModulePath)) {
    return projectModulePath;
  }

  return path.resolve(workspaceRoot, "node_modules", moduleName);
}

config.watchFolders = [workspaceRoot];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: resolveModuleFromProjectOrWorkspace("react"),
  "react-native": resolveModuleFromProjectOrWorkspace("react-native"),
};

module.exports = config;
