// Build-time text imports supplied by tsup.
declare module "*.scss" {
  const css: string;
  export default css;
}

declare module "*.inline.ts" {
  const script: string;
  export default script;
}
