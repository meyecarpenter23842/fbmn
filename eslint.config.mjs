import nextVitals from "eslint-config-next/core-web-vitals";
const config = [{ ignores: ["apps/admin/**"] }, ...nextVitals];
export default config;
