import { TagPage as UpstreamTagPage } from "@quartz-community/tag-page";
import type { TagPageOptions } from "@quartz-community/tag-page";
import { compareExplorerListEntries } from "./sort.js";
import { OttonTagContent } from "./TagContent.js";

export { compareExplorerListEntries } from "./sort.js";
export { OttonTagContent } from "./TagContent.js";

export const TagPage = (opts?: TagPageOptions) => {
  const options = {
    ...opts,
    sort: compareExplorerListEntries,
  };

  return {
    ...UpstreamTagPage(options),
    body: () => OttonTagContent(options),
  };
};

export default TagPage;
