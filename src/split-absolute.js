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
  gutterStyle: null,
  animationDuration: 300,
  compareThreshold: 0.001
}

const defaultPaneOptions = {
  id: null,
  element: null,
  size: 0,
  minSize: 0,
  disabled: false,
  fallbackExpandSize: null
}

const defaultClassNames = {
  containerClassName: "sa-splitview",
  horizontalClassName: "sa-splitview--horizontal",
  verticalClassName: "sa-splitview--vertical",
  paneClassName: "sa-splitview__pane",
  paneAnimatedClassName: "sa-splitview__pane--animated",
  paneCollapsingClassName: "sa-splitview__pane--collapsing",
  paneExpandingClassName: "sa-splitview__pane--expanding",
  gutterClassName: "sa-splitview__gutter",
  gutterDisabledClassName: "sa-splitview__gutter--disabled",
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
    this.animationTimer = null;
    this.toggleSizes = {};
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

    const percentSizes = this.splitter.getSizes();
    this.updateGutters(percentSizes);
    this.updatePanePositions(percentSizes);
    this.updateDisabledState();
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

    this.emit("gutter", gutterElement, this);
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

  adjustPaneToSize(index, size) {
    const pixelSizes = this.convertPercentToPxArray(this.splitter.getSizes());
    const delta = pixelSizes[index] - size;
    pixelSizes[index] = size;

    const getPriority = (pane, idx) => {
      if (index === idx) return -1;
      if (pane.size === 0) return 1;
      return 0;
    }

    const prioritySizes = this.panes.map((pane, index) => ({
      size: pixelSizes[index],
      minSize: pane.minSize,
      priority: getPriority(pane, index),
      index
    })).sort((a, b) => {
      if (a.priority === b.priority) {
        return b.index - a.index
      }
      return b.priority - a.priority;
    });

    this.distributeSizes(prioritySizes, delta);

    const distributedPixelSizes = prioritySizes
      .sort((a, b) => a.index - b.index)
      .map(({ size }) => size);

    const distributedPercentSizes = this.convertPxToPercentArray(distributedPixelSizes);
    this.correctDistribution(distributedPercentSizes);
    this.splitter.setSizes(distributedPercentSizes);
  }

  resizePaneSizes(delta) {
    const oldContanerSize = this.containerSize;
    const newContainerSize = oldContanerSize + delta;

    const pixelSizes = this.splitter.getSizes()
      .map((percent) => (oldContanerSize * percent) / 100);

    const prioritySizes = this.panes.map((pane, index) => ({
      size: pixelSizes[index],
      minSize: pane.minSize,
      priority: pane.size === 0 ? 1 : 0,
      index
    })).sort((a, b) => {
      if (a.priority === b.priority) {
        return b.index - a.index
      }
      return b.priority - a.priority;
    });

    this.distributeSizes(prioritySizes, delta);

    const distributedSizes = prioritySizes.sort((a, b) => a.index - b.index)
      .map(({ size }) => (size * 100) / newContainerSize);

    this.correctDistribution(distributedSizes);

    this.containerSize = newContainerSize;
    this.splitter.setSizes(distributedSizes);

    const updatedSizes = this.splitter.getSizes();
    this.updateGutters(updatedSizes);

    this.emit("resize", updatedSizes, this);
  }

  distributeSizes(data, delta) {
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
        this.distributeSizes(data.slice(1), tail);
      } else {
        first.size = clamp(first.minSize, first.size - delta, first.size);
      }
    }
  }

  correctDistribution(percentSizes) {
    const s = sum(percentSizes);
    const delta = 100 - s;
    percentSizes[percentSizes.length - 1] += delta;
  }

  convertPecentToPx(value) {
    return (this.containerSize * value) / 100;
  }

  convertPxToPercent(value) {
    return (value * 100) / this.containerSize;
  }

  convertPercentToPxArray(values) {
    return values.map(value => this.convertPecentToPx(value));
  }

  convertPxToPercentArray(values) {
    return values.map(value => this.convertPxToPercent(value));
  }

  invalidateSize() {
    const oldSize = this.containerSize;
    const newSize = this.getContainerSize(this.container, this.options.direction);
    const delta = newSize - oldSize;
    this.resizePaneSizes(delta);
  }

  collapsePaneAt(index, animated = false) {
    if (animated) {
      this.preparePaneAnimation("collapsing");
    }

    this.splitter.collapse(index);

    const percentSizes = this.splitter.getSizes();
    this.updateGutters(percentSizes);

    this.emit("resize", percentSizes, this);
  }

  collapsePane(id, animated = false) {
    const index = this.panes.findIndex(pane => pane.id === id);

    if (index !== -1) {
      this.collapsePaneAt(index, animated);
    }
  }

  isCollapsedPaneAt(index) {
    const minSize = this.panes[index].minSize;
    const pixelSize = this.convertPecentToPx(this.splitter.getSizes()[index]);
    return Math.abs(pixelSize - minSize) <= this.options.compareThreshold;
  }

  isCollapsedPane(id) {
    const index = this.panes.findIndex(pane => pane.id === id);

    if (index !== -1) {
      return this.isCollapsedPaneAt(index);
    }

    return false;
  }

  expandPaneAt(index, size, animated = false) {
    if (animated) {
      this.preparePaneAnimation("expanding");
    }

    this.adjustPaneToSize(index, size);

    const percentSizes = this.splitter.getSizes();
    this.updateGutters(percentSizes);

    this.emit("resize", percentSizes, this);
  }

  expandPane(id, size, animated = false) {
    const index = this.panes.findIndex(pane => pane.id === id);

    if (index !== -1) {
      this.expandPane(index, size, animated);
    }
  }

  togglePaneAt(index, size = null, animated = false) {
    if (this.isCollapsedPaneAt(index)) {
      size = size
        ?? this.toggleSizes[index]
        ?? this.panes[index].fallbackExpandSize;

      if (isDefined(size)) {
        this.expandPaneAt(index, size, animated);
      }
    } else {
      this.toggleSizes[index] = this.convertPecentToPx(this.splitter.getSizes()[index]);
      this.collapsePaneAt(index, animated)
    }
  }

  togglePane(id, size = null, animated = false) {
    const index = this.panes.findIndex(pane => pane.id === id);

    if (index !== -1) {
      this.togglePaneAt(index, size, animated);
    }
  }

  disablePaneAt(index, value) {
    if (this.panes[index]) {
      this.panes[index].disabled = !!value;
      this.updateDisabledState();
    }
  }

  disablePane(id, value) {
    const index = this.panes.findIndex(pane => pane.id === id);

    if (index !== -1) {
      this.disablePaneAt(index, value);
    }
  }

  updateDisabledState() {
    const pairs = this.splitter.pairs;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const disabled = this.panes[pair.a]?.disabled || this.panes[pair.b]?.disabled;
      this.disableGutter(pair.gutter, disabled);
    }
  }

  disableGutter(gutterElement, value) {
    if (gutterElement) {
      const classList = gutterElement.classList;

      if (value) {
        classList.add(this.options.gutterDisabledClassName);
      } else {
        classList.remove(this.options.gutterDisabledClassName)
      }
    }
  }

  preparePaneAnimation(animationName) {
    clearTimeout(this.animationTimer);
    this.addAnimationClasses(animationName);
    this.animationTimer = setTimeout(() => {
      this.removeAnimationClasses();
    }, this.options.animationDuration);
  }

  addAnimationClasses(name) {
    for (let i = 0; i < this.panes.length; i++) {
      const paneElement = this.panes[i].element;
      paneElement.classList.add(this.options.paneAnimatedClassName);

      if (name === "collapsing") {
        paneElement.classList.add(this.options.paneCollapsingClassName);
      } else if (name === "expanding") {
        paneElement.classList.add(this.options.paneExpandingClassName);
      }
    }
  }

  removeAnimationClasses() {
    for (let i = 0; i < this.panes.length; i++) {
      const paneElement = this.panes[i].element;
      paneElement.classList.remove(this.options.paneAnimatedClassName);
      paneElement.classList.remove(this.options.paneCollapsingClassName);
      paneElement.classList.remove(this.options.paneExpandingClassName);
    }
  }

  onDragStart(paneSizes) {
    this.updateGutters(paneSizes);
    this.emit("resize", paneSizes, this);
  }

  onDragEnd(paneSizes) {
    this.updateGutters(paneSizes);
    this.emit("resize", paneSizes, this);
  }

  onDrag(paneSizes) {
    this.updateGutters(paneSizes);
    this.emit("resize", paneSizes, this);
  }

  destroy() {
    this.removeAllListeners();

    clearTimeout(this.animationTimer);
    this.removeAnimationClasses();

    this.splitter?.destroy();
    this.splitter = null;

    this.panes = null;
    this.options = null;
    this.container = null;
    this.gutterElements = [];
  }
}

export default SplitAbsolute;
