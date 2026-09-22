import { QuartzComponent } from '@quartz-community/types';

interface Options {
    layout: "modern" | "legacy";
}
declare const _default: (userOptions?: Partial<Options>) => QuartzComponent;

export { _default as TableOfContents };
