import { installMapRuntime } from "./runtime.js";

declare const cartoBasemapsApiKey: string;
installMapRuntime(cartoBasemapsApiKey);
