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

const splitview = new SplitView(panes, options);
```

Default html template

```html
<div class="sv-splitview">
  <div id="pane1" class="sv-splitview__pane"></div>
  <div id="pane2" class="sv-splitview__pane"></div>
</div>
```
