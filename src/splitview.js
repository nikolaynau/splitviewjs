import SplitAbsolute from './split-absolute';
import SplitPercent from './split-percent';

function SplitView(panes, options) {
  const usePercent = options?.percent ?? true;

  if (usePercent) {
    return new SplitPercent(panes, options);
  } else {
    return new SplitAbsolute(panes, options);
  }
}

SplitView.SplitAbsolute = SplitAbsolute;
SplitView.SplitPercent = SplitPercent;

export default SplitView;
