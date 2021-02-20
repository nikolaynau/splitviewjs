import Split from "split.js"
import EventEmitter from "eventemitter3"
import { isDefined } from "./utils"

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
  snapOffset: 0,
  dragInterval: 1,
  direction: Direction.Vertical,
  cursor: "col-resize",
  createGutter: null,
  elementStyle: null,
  gutterStyle: null
}

const defaultPaneOptions = {
  id: null,
  element: null,
  size: 0,
  minSize: 0
}

const defaultClassNames = {
  containerClassName: "sp-splitview",
  horizontalClassName: "sp-splitview--horizontal",
  verticalClassName: "sp-splitview--vertical",
  paneClassName: "sp-splitview__pane",
  gutterClassName: "sp-splitview__gutter",
  gutterAbsoluteClassName: "sp-splitview__gutter--absolute",
  customGutterClassName: null
}

class SplitPercent extends EventEmitter {
  constructor(panes, options) {
    super()

    this.onDrag = this.onDrag.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);

    this.createGutter = this.createGutter.bind(this);
    this.setElementStyle = this.setElementStyle.bind(this);
    this.setGutterStyle = this.setGutterStyle.bind(this);

    this.panes = this.normalizePaneOptions([...panes]);
    this.options = { ...defaultOptions, ...defaultClassNames, ...options };
    this.gutterElements = [];
    this.splitter = this.createSplitter(this.panes, this.options);

    if (this.isGutterAbsolute) {
      this.updateGutters(this.splitter.getSizes());
    }
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

  createSplitter(panes, options) {
    const splitOptions = {};

    splitOptions.expandToMin = options.expandToMin;
    splitOptions.snapOffset = options.snapOffset;
    splitOptions.dragInterval = options.dragInterval;
    splitOptions.gutterAlign = options.gutterAlign;

    if (options.direction === Direction.Vertical) {
      splitOptions.direction = "horizontal";
    } else {
      splitOptions.direction = "vertical";
    }

    if (options.gutterMode === GutterMode.Absolute) {
      splitOptions.gutterSize = 0;
    } else {
      splitOptions.gutterSize = options.gutterSize;
    }

    splitOptions.gutter = this.createGutter;
    splitOptions.elementStyle = this.setElementStyle;
    splitOptions.gutterStyle = this.setGutterStyle;

    splitOptions.onDrag = this.onDrag;
    splitOptions.onDragStart = this.onDragStart;
    splitOptions.onDragEnd = this.onDragEnd;

    const paneElements = panes.map(pane => pane.element);
    const minSizes = panes.map(pane => pane.minSize);
    let sizes = panes.map(pane => pane.size);
    const maxSize = Math.max(...sizes);

    if (maxSize === 0) {
      sizes = null;
    }

    splitOptions.sizes = sizes;
    splitOptions.minSize = minSizes;

    const container = paneElements[0]?.parentNode;
    container?.classList.add(options.containerClassName);

    if (options.direction === Direction.Vertical) {
      container?.classList.add(options.verticalClassName);
    } else {
      container?.classList.add(options.horizontalClassName);
    }

    paneElements.forEach(pane => {
      pane.classList.add(options.paneClassName);
    });

    return Split(paneElements, splitOptions);
  }

  createGutter() {
    let gutterElement = this.options.createGutter?.();

    if (!gutterElement) {
      gutterElement = document.createElement("div");
    }

    gutterElement.classList.add(this.options.gutterClassName);

    if (this.options.customGutterClassName) {
      gutterElement.classList.add(this.options.customGutterClassName);
    }

    if (this.isGutterAbsolute) {
      gutterElement.classList.add(this.options.gutterAbsoluteClassName);
      this.gutterElements.push(gutterElement);
    }

    this.emit("gutter-created", gutterElement, this);
    return gutterElement;
  }

  setElementStyle(dimension, size, gutterSize, index) {
    const customProps = this.options.elementStyle?.(dimension, size, gutterSize, index);

    if (this.isGutterAbsolute) {
      return {
        "flex-basis": `${size}%`,
        ...customProps
      }
    } else {
      return {
        "flex-basis": `calc(${size}% - ${gutterSize}px)`,
        ...customProps
      }
    }
  }

  setGutterStyle(dimension, gutterSize) {
    const customProps = this.options.gutterStyle?.(dimension, gutterSize);

    if (this.isGutterAbsolute) {
      return {
        [dimension]: `${this.options.gutterSize}px`,
        [dimension === "width" ? "left" : "top"]: "0",
        ...customProps
      }
    } else {
      return {
        "flex-basis": `${gutterSize}px`,
        ...customProps
      }
    }
  }

  updateGutters(paneSizes) {
    const prop = this.options.direction === Direction.Vertical ? "left" : "top";
    const halfGutSize = this.options.gutterSize / 2;
    let accumulatedSize = 0;

    for (let i = 0; i < this.gutterElements.length; i++) {
      const gutterElement = this.gutterElements[i];

      if (isDefined(paneSizes[i])) {
        accumulatedSize += paneSizes[i];
        gutterElement.style[prop] = `calc(${accumulatedSize}% - ${halfGutSize}px)`;
      }
    }
  }

  get isGutterAbsolute() {
    return this.options.gutterMode === GutterMode.Absolute;
  }

  collapsePaneAt(index) {
    this.splitter.collapse(index);

    if (this.isGutterAbsolute) {
      this.updateGutters(this.splitter.getSizes());
    }
  }

  collapsePane(id) {
    const index = this.panes.findIndex(pane => pane.id === id);

    if (index !== -1) {
      this.collapsePaneAt(index);
    }
  }

  onDragStart(paneSizes) {
    if (this.isGutterAbsolute) {
      this.updateGutters(paneSizes);
    }

    this.emit("before-resize", paneSizes, this);
  }

  onDragEnd(paneSizes) {
    if (this.isGutterAbsolute) {
      this.updateGutters(paneSizes);
    }

    this.emit("resized", paneSizes, this);
  }

  onDrag(paneSizes) {
    if (this.isGutterAbsolute) {
      this.updateGutters(paneSizes);
    }

    this.emit("resize", paneSizes, this);
  }

  destroy() {
    this.removeAllListeners();
    this.splitter?.destroy();
    this.splitter = null;
    this.panes = null;
    this.options = null;
    this.gutterElements = [];
  }
}

export default SplitPercent;
