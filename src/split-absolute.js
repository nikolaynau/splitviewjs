import Split from "split.js"
import EventEmitter from "eventemitter3"
import { clamp, findIndexes, percentToNumber, pxToPercent, sum, isDefined } from "./utils"

const Direction = Object.freeze({
  Horizontal: "horizontal",
  Vertical: "vertical"
})

const defaultOptions = {
  expandToMin: false,
  gutterSize: 4,
  gutterAlign: "center",
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
  containerClassName: "sa-splitview",
  horizontalClassName: "sa-splitview--horizontal",
  verticalClassName: "sa-splitview--vertical",
  paneClassName: "sa-splitview__pane",
  gutterClassName: "sa-splitview__gutter",
  customGutterClassName: null
}

class SplitAbsolute extends EventEmitter {
  constructor(panes, options) {
    super()

    this.onDrag = this.onDrag.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);

    this.createGutter = this.createGutter.bind(this);
    this.setElementStyle = this.setElementStyle.bind(this);
    this.setGutterStyle = this.setGutterStyle.bind(this);

    this.gutterElements = [];
    this.panes = this.normalizePaneOptions([...panes]);
    this.options = { ...defaultOptions, ...defaultClassNames, ...options };

    this.container = this.panes[0].element.parentNode;
    this.container.classList.add(this.options.containerClassName);

    if (this.options.direction === Direction.Vertical) {
      this.container.classList.add(this.options.verticalClassName);
    } else {
      this.container.classList.add(this.options.horizontalClassName);
    }

    this.containerSize = this.getContainerSize(this.container, this.options.direction);
    this.splitter = this.createSplitter(this.panes, this.options, this.containerSize);

    const sizes = this.splitter.getSizes();
    this.updateGutters(sizes);
    this.updatePanePositions(sizes);
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

  normalizePaneSizes(sizes, containerSize) {
    let resultSizes = sizes.map(size => percentToNumber(size))
      .map(size => pxToPercent(size, containerSize));
    const zeroSizeIndexes = findIndexes(resultSizes, size => size === 0);

    if (zeroSizeIndexes.length > 0) {
      const leftSize = clamp(0, 100 - sum(resultSizes), 100);
      const distrSize = leftSize / zeroSizeIndexes.length;
      zeroSizeIndexes.forEach(index => resultSizes[index] = distrSize);
    }

    return resultSizes;
  }

  getContainerSize(container, direction) {
    const { width, height } = container.getBoundingClientRect();
    return direction === Direction.Vertical ? width : height;
  }

  createSplitter(panes, options, containerSize) {
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

    splitOptions.gutterSize = 0;
    splitOptions.gutter = this.createGutter;
    splitOptions.elementStyle = this.setElementStyle;
    splitOptions.gutterStyle = this.setGutterStyle;

    splitOptions.onDrag = this.onDrag;
    splitOptions.onDragStart = this.onDragStart;
    splitOptions.onDragEnd = this.onDragEnd;

    const paneElements = panes.map(pane => pane.element);
    const minSizes = panes.map(pane => pane.minSize);
    let sizes = panes.map(pane => pane.size);
    sizes = this.normalizePaneSizes(sizes, containerSize);

    splitOptions.sizes = sizes;
    splitOptions.minSize = minSizes;

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

    this.gutterElements.push(gutterElement);
    this.emit("gutter-created", gutterElement, this);
    return gutterElement;
  }

  setElementStyle(dimension, size, gutterSize, index) {
    const customProps = this.options.elementStyle?.(dimension, size, gutterSize, index);
    const position = this.convertPecentToPx(this.computePanePositionPercent(index));

    return {
      [dimension]: `${this.convertPecentToPx(size)}px`,
      [dimension === "width" ? "left" : "top"]: `${position}px`,
      ...customProps
    }
  }

  setGutterStyle(dimension, gutterSize) {
    const customProps = this.options.gutterStyle?.(dimension, gutterSize);

    return {
      [dimension]: `${this.options.gutterSize}px`,
      [dimension === "width" ? "left" : "top"]: "0",
      ...customProps
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
        gutterElement.style[prop] = `${this.convertPecentToPx(accumulatedSize) - halfGutSize}px`;
      }
    }
  }

  updatePanePositions(paneSizes) {
    const prop = this.options.direction === Direction.Vertical ? "left" : "top";
    let accumulatedSize = 0;

    for (let i = 0; i < this.panes.length; i++) {
      const { element } = this.panes[i];

      if (isDefined(paneSizes[i])) {
        element.style[prop] = `${this.convertPecentToPx(accumulatedSize)}px`;
        accumulatedSize += paneSizes[i];
      }
    }
  }

  computePanePositionPercent(paneIndex) {
    if (paneIndex === 0) return 0;
    let result = 0;

    const sizes = this.splitter?.getSizes();
    if (!sizes) return 0;

    for (let i = 0; i < paneIndex; i++) {
      const paneSize = sizes[i];
      if (isDefined(paneSize)) {
        result += paneSize;
      }
    }

    return result;
  }

  resizePaneSizes(delta) {
    const oldContanerSize = this.containerSize;
    const newContainerSize = oldContanerSize + delta;

    const sizes = this.splitter.getSizes()
      .map((percent) => (oldContanerSize * percent) / 100);

    const prioritySizes = this.panes.map((pane, index) => ({
      size: sizes[index],
      minSize: pane.minSize,
      priority: pane.size === 0 ? 1 : 0,
      index
    })).sort((a, b) => {
      if (a.priority === b.priority) {
        return b.index - a.index
      }
      return b.priority - a.priority;
    });

    this.priorityDistribution(prioritySizes, delta);

    const newSizes = prioritySizes.sort((a, b) => a.index - b.index)
      .map(({ size }) => (size * 100) / newContainerSize);
    this.correctDistribution(newSizes);

    this.containerSize = newContainerSize;
    this.splitter.setSizes(newSizes);

    const updatedSizes = this.splitter.getSizes();
    this.updateGutters(updatedSizes);

    this.emit("resize", updatedSizes, this);
  }

  priorityDistribution(data, delta) {
    if (data.length === 0) return;
    const first = data[0];

    if (delta > 0) {
      first.size += delta;
    } else {
      delta = Math.abs(delta);
      const available = clamp(0, first.size - first.minSize, first.size);
      const tail = available - delta;

      if (tail < 0) {
        first.size = clamp(first.minSize, first.size - (delta - Math.abs(tail)), first.size);
        this.priorityDistribution(data.slice(1), tail);
      } else {
        first.size = clamp(first.minSize, first.size - delta, first.size);
      }
    }
  }

  correctDistribution(sizesInPercent) {
    const s = sum(sizesInPercent);
    const delta = 100 - s;
    sizesInPercent[sizesInPercent.length - 1] += delta;
  }

  convertPecentToPx(value) {
    return (this.containerSize * value) / 100;
  }

  convertPxToPercent(value) {
    return (value * 100) / this.containerSize;
  }

  convertPxToPercentArray(values) {
    return values.map(value => this.convertPecentToPx(value));
  }

  invalidateSize() {
    const oldSize = this.containerSize;
    const newSize = this.getContainerSize(this.container, this.options.direction);
    const delta = newSize - oldSize;
    this.resizePaneSizes(delta);
  }

  collapsePaneAt(index) {
    this.splitter.collapse(index);
    this.updateGutters(this.splitter.getSizes());
  }

  collapsePane(id) {
    const index = this.panes.findIndex(pane => pane.id === id);

    if (index !== -1) {
      this.collapsePaneAt(index);
    }
  }

  onDragStart(paneSizes) {
    this.updateGutters(paneSizes);
    this.emit("before-resize", paneSizes, this);
  }

  onDragEnd(paneSizes) {
    this.updateGutters(paneSizes);
    this.emit("resized", paneSizes, this);
  }

  onDrag(paneSizes) {
    this.updateGutters(paneSizes);
    this.emit("resize", paneSizes, this);
  }

  destroy() {
    this.removeAllListeners();
    this.splitter?.destroy();
    this.splitter = null;
    this.panes = null;
    this.options = null;
    this.container = null;
    this.gutterElements = [];
  }
}

export default SplitAbsolute;
