require("@expo/metro-runtime");

const { registerRootComponent } = require("expo");
const App = require("./src/App").default;

registerRootComponent(App);
