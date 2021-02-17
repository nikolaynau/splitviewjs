import Split from "split.js"
import EventEmitter from "eventemitter3"

const GutterMode = Object.freeze({
  Embed: "embed",
  Absolute: "absolute"
})

const Direction = Object.freeze({
  Horizontal: "horizontal",
  Vertical: "vertical"
})

const defaultOptions = {
  expandToMin: false,
  gutterSize: 4,
  gutterAlign: "center",
  gutterMode: GutterMode.Embed,
  snapOffset: 30,
  dragInterval: 1,
  direction: Direction.Vertical,
  cursor: "col-resize",
  createGutter: null,
  elementStyle: null,
  gutterStyle: null
}

const defaultPaneOptions = {
  element: null,
  size: 200,
  minSize: 100
}

class SplitPercent extends EventEmitter {
  constructor(panes, options) {
    debugger
    super()

    this.panes = this.normalizePaneOptions([...panes]);
    this.options = { ...defaultOptions, ...options };
  }

  normalizePaneOptions(panes) {
    return panes.map(pane => {
      if (pane instanceof HTMLElement) {
        return {
          ...defaultPaneOptions,
          element: pane
        }
      } else {
        return {
          ...defaultPaneOptions,
          ...pane
        }
      }
    })
  }
}

export default SplitPercent;
