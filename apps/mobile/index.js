// expo-dev-client'ı ilk satırda import et — dev build bağlantısını sağlar
import "expo-dev-client";
import { AppRegistry } from "react-native";
import App from "./src/App";

AppRegistry.registerComponent("main", () => App);
