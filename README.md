# splitview

## Installation

```bash
npm install @ba/splitview
```

## Usage

```javascript
import SplitView from '@ba/splitview'
import "@ba/splitview/dist/splitview.css";

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
