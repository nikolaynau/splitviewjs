import SplitAbsolute from "./split-absolute";
import SplitPercent from "./split-percent";

export default (panes, options) => {
  const usePercent = options?.percent ?? true;

  if (usePercent) {
    return new SplitPercent(panes, options);
  } else {
    return new SplitAbsolute(panes, options);
  }
};
