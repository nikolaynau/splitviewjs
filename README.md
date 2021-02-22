# splitview.js [![npm version](https://badge.fury.io/js/splitview.js.svg)](https://badge.fury.io/js/splitview.js)

> SplitView implementation based on [Split.js](https://github.com/nathancahill/split)

There are two implementations:

**split-percent**

- layout: **flexbox**
- property: ***flex-basis***
- unit: **percent**
- embed and absolute gutters
- collapse with animation
- disable pane

**split-absolute**

- layout: **absolute position**
- property: ***left, top, width, height***
- unit: **pixel**
- absolute gutters
- collapse, expand, toggle with animation
- disable pane
- smart size distribution

## Installation

Using npm:

```bash
npm install splitview.js
```

Using yarn:

```bash
yarn add splitview.js
```

## Usage

```javascript
import SplitView from 'splitview.js'
import 'splitview.js/dist/splitview.css';

const panes = [
  document.getElementById('pane1'),
  document.getElementById('pane2')
];
const splitview = SplitView(panes, options?);
```

Default HTML:

```html
<div>
  <div id="pane1"></div>
  <div id="pane2"></div>
</div>
```

## Documentation

### Pane options:

| Name                  | Type            | Default        | Description                                                                                                                                   |
| --------------------- | --------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | Number, String  | `null`         | Unique pane id. Used in api methods. (optional)                                                                                         |
| `element`             | HTMLElement     | `null`         | Pane element. (**required**)                                                                                                                      |
| `size`                | Number, String  | `0`            | Initial size of pane element in percents. In ***split-absolute*** availabe `'px'` and `'%'`, `0` value take up the remaining size. (optional) |
| `minSize`             | Number          | `0`            | Minimum size of pane element in pixels. (optional)                                                                                            |
| `disabled`            | Boolean         | `false`        | Disable resize of pane element. (optional)                                                                                                    |
| `fallbackExpandSize`  | Number          | `null`         | Fallback expand size in pixels. Only in ***split-absolute***. (optional)                                                                      |

### Options:

| Name                    | Type         | Default        | Description                                                                                                                      |
| ----------------------- | ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `percent`               | Boolean      | `true`         | Create percent or absolute splitview. (optional)                                                                                 |
| `expandToMin`           | Boolean      | `false`        | Grow initial sizes to pane minSize. (optional)                                                                                   |
| `gutterSize`            | Number       | `4`            | Gutter size in pixels. (optional)                                                                                                |
| `gutterAlign`           | String       | `'center'`     | Gutter alignment between elements. (optional)                                                                                    |
| `gutterMode`            | String       | `'embed'`      | Gutter takes size between elements. Value: `'embed'` or `'absolute'`. In ***split-absolute*** is always `'absolute'`. (optional) |
| `snapOffset`            | Number       | `0`            | Snap to minimum size offset in pixels. (optional)                                                                                |
| `dragInterval`          | Number       | `1`            | Number of pixels to drag. (optional)                                                                                             |
| `direction`             | String       | `vertical`     | Direction to split: `'vertical'` or `'horizontal'`. (optional)                                                                   |
| `cursor`                | String       | `col-resize`   | Cursor to display while dragging. (optional)                                                                                     |
| `createGutter`          | Function     | `null`         | Create custom gutter element. (optional)                                                                                         |
| `elementStyle`          | Function     | `null`         | Set the custom style of each element. (optional)                                                                                 |
| `gutterStyle`           | Function     | `null`         | Set the custom style of the gutter. (optional)                                                                                   |
| `customGutterClassName` | String       | `null`         | Additional gutter class name. (optional)                                                                                         |

### Events:

| Event name                     | Type         | Description         |
| -------------- | ------------- | ---------------------------------- |
| `resize`       | Array         | Emit every time the size changes.  |
| `gutter`       | HTMLElement   | Emit when created gutter element.  |

## Examples

Create percent slitview:

```javascript
const panes = [
  {
    element: document.getElementById('pane1'),
    size: 30 //%,
    minSize: 100 //px
  },
  {
    element: document.getElementById('pane2'),
    size: 40 //%,
    minSize: 200 //px
  },
  {
    element: document.getElementById('pane3'),
    size: 30 //%,
    minSize: 0 //px
  }
];
const splitview = SplitView(panes);

splitview.on("resize", (percentSizes, sender) => {
  console.log(percentSizes, sender);
});
```

Create absolute slitview:

```javascript
const panes = [
  {
    element: document.getElementById('pane1'),
    size: "300px"
    minSize: 40 //px
  },
  {
    element: document.getElementById('pane2'),
    size: 0, // take up the remaining size
    minSize: 300 //px
  },
  {
    element: document.getElementById('pane3'),
    size: "20%",
    minSize: 0 //px
  }
];
const splitview = SplitView(panes, {
  percent: false,
  snapOffset: 30
});

splitview.on("resize", (percentSizes, sender) => {
  console.log(percentSizes, sender);
});

// Distribute size on window resize
window.addEventListener("resize", () => {
  splitview.invalidateSize();
});
```

More expamples see [demo](demo/index.html).

## API

Create percent splitview instance:

```javascript
  const instance = SplitView(panes, options);
```

Create absolute splitview instance:

```javascript
  const instance = SplitView(panes, {
    percent: false,
    ...
  });
```

Directly instantiate `SplitPercent`:

```javascript
  const instance = new SplitView.SplitPercent(panes, options);
```

Directly instantiate `SplitAbsolute`:

```javascript
  const instance = new SplitView.SplitAbsolute(panes, options);
```

SplitPercent:

#### `.collapsePaneAt(index, animated? = false)`
#### `.collapsePane(id, animated? = false)`
#### `.disablePaneAt(index)`
#### `.disablePane(id)`
#### `.destroy()`

SplitAbsolute:

#### `.invalidateSize()`
#### `.collapsePaneAt(index, animated? = false)`
#### `.collapsePane(id, animated? = false)`
#### `.expandPaneAt(index, size, animated? = false)`
#### `.expandPane(id, size, animated? = false)`
#### `.togglePaneAt(index, size? = null, animated? = false)`
#### `.togglePane(id, size? = null, animated? = false)`
#### `.isCollapsedPaneAt(index)`
#### `.isCollapsedPane(id)`
#### `.disablePaneAt(index)`
#### `.disablePane(id)`
#### `.destroy()`

## License

Licensed under the [MIT License](./LICENSE).
