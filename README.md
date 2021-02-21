# splitview.js

> SplitView implementation based on [Split.js](https://github.com/nathancahill/split)

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
const splitview = SplitView(panes, options);
```

Default html template

```html
<div>
  <div id="pane1"></div>
  <div id="pane2"></div>
</div>
```
