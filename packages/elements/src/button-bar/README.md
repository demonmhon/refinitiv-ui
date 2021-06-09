# Button Bar

```live(preview)
<div style="display:flex; flex-direction:column;">
  <ef-button-bar>
    <ef-button>One</ef-button>
    <ef-button>Two</ef-button>
    <ef-button>Three</ef-button>
    <ef-button>Four</ef-button>
    <ef-button>Five</ef-button>
  </ef-button-bar>

  <ef-button-bar managed>
    <ef-button active toggles>One</ef-button>
    <ef-button toggles>Two</ef-button>
    <ef-button toggles>Three</ef-button>
    <ef-button toggles>Four</ef-button>
    <ef-button toggles>Five</ef-button>
  </ef-button-bar>

  <ef-button-bar>
    <ef-button toggles active icon="bold"></ef-button>
    <ef-button toggles icon="italic"></ef-button>
    <ef-button toggles icon="underline"></ef-button>
    <ef-button-bar managed>
      <ef-button toggles active icon="text-left"></ef-button>
      <ef-button toggles icon="text-center"></ef-button>
      <ef-button toggles icon="text-right"></ef-button>
      <ef-button toggles icon="text-center"></ef-button>
    </ef-button-bar>
    <ef-button icon="increase-indent"></ef-button>
    <ef-button icon="decrease-indent"></ef-button>
    <ef-button icon="image"></ef-button>
    <ef-button icon="print"></ef-button>
  </ef-button-bar>
</div>
```

`ef-button-bar` is used to display multiple buttons to create a list of commands bar.

## Basic usage
Button Bar can be created by using `ef-button` as a content inside `ef-button-bar`. You can use it to create a button with an additional menu on the side, or different styles of toolbar control. 

The Button Bar control aims to provide a simple array of buttons. You can use it together with Overlay Menu to create a dropdown menu. 


```live
<ef-button-bar>
	<ef-button>Reply All</ef-button>
  <ef-button icon="down"></ef-button>
</ef-button-bar>
```
```html
<ef-button-bar>
  <ef-button>Reply All</ef-button>
  <ef-button icon="down"></ef-button>
</ef-button-bar>
```

### Creating multiple buttons toolbar
You can use Button Bar to create a simple toolbar.

```live
<ef-button-bar>
  <ef-button icon="skip-to-start"></ef-button>
  <ef-button icon="play"></ef-button>
  <ef-button icon="skip-to-end"></ef-button>
  <ef-button icon="sound-mute"></ef-button>
  <ef-button icon="sound-decrease"></ef-button>
  <ef-button icon="sound-increase"></ef-button>
  <ef-button icon="sound-on"></ef-button>
</ef-button-bar>
```

```html
<ef-button-bar>
  <ef-button icon="skip-to-start"></ef-button>
  <ef-button icon="play"></ef-button>
  <ef-button icon="skip-to-end"></ef-button>
  <ef-button icon="sound-mute"></ef-button>
  <ef-button icon="sound-decrease"></ef-button>
  <ef-button icon="sound-increase"></ef-button>
  <ef-button icon="sound-on"></ef-button>
</ef-button-bar>
```

### Toggle buttons
Buttons can be set to a toggled mode by using `toggles` attribute. Each button can be toggled independently.

```live
<ef-button-bar>
  <ef-button toggles icon="candle-chart"></ef-button>
  <ef-button toggles icon="chart-line-bar"></ef-button>
  <ef-button toggles icon="pie-chart"></ef-button>
  <ef-button toggles icon="grid"></ef-button>
</ef-button-bar>
```

```html
<ef-button-bar>
  <ef-button toggles icon="candle-chart"></ef-button>
  <ef-button toggles icon="chart-line-bar"></ef-button>
  <ef-button toggles icon="pie-chart"></ef-button>
  <ef-button toggles icon="grid"></ef-button>
</ef-button-bar>
```

If one button can be active at a time, add `managed` attribute to `ef-button-bar`.

```live
<ef-button-bar managed>
  <ef-button toggles icon="candle-chart"></ef-button>
  <ef-button toggles icon="chart-line-bar"></ef-button>
  <ef-button toggles icon="pie-chart"></ef-button>
  <ef-button toggles icon="grid"></ef-button>
</ef-button-bar>
```

```html
<ef-button-bar managed>
  <ef-button toggles icon="candle-chart"></ef-button>
  <ef-button toggles icon="chart-line-bar"></ef-button>
  <ef-button toggles icon="pie-chart"></ef-button>
  <ef-button toggles icon="grid"></ef-button>
</ef-button-bar>
```

### Mixing different styles
`ef-button-bar` supports more complex use cases such as having managed buttons along with other types.


```live
<ef-button-bar>
  <ef-button toggles active icon="bold"></ef-button>
  <ef-button toggles icon="italic"></ef-button>
  <ef-button toggles icon="underline"></ef-button>
  <ef-button-bar managed>
    <ef-button toggles active icon="text-left"></ef-button>
    <ef-button toggles icon="text-center"></ef-button>
    <ef-button toggles icon="text-right"></ef-button>
    <ef-button toggles icon="text-center"></ef-button>
  </ef-button-bar>
  <ef-button icon="increase-indent"></ef-button>
  <ef-button icon="decrease-indent"></ef-button>
  <ef-button icon="image"></ef-button>
  <ef-button icon="print"></ef-button>
</ef-button-bar>
```

```html
<ef-button-bar>
  <ef-button toggles active icon="bold"></ef-button>
  <ef-button toggles icon="italic"></ef-button>
  <ef-button toggles icon="underline"></ef-button>
  <ef-button-bar managed>
    <ef-button toggles active icon="text-left"></ef-button>
    <ef-button toggles icon="text-center"></ef-button>
    <ef-button toggles icon="text-right"></ef-button>
    <ef-button toggles icon="text-center"></ef-button>
  </ef-button-bar>
  <ef-button icon="increase-indent"></ef-button>
  <ef-button icon="decrease-indent"></ef-button>
  <ef-button icon="image"></ef-button>
  <ef-button icon="print"></ef-button>
</ef-button-bar>
```

### Events
To listen to tap event on the button, add `tap` event listener to an individual `ef-button` or `ef-button-bar`.

```live
<style>
  .container {
    display: inline-flex;
    align-items: center;
  }
  #text {
    padding-left: 20px;
  }
</style>
<div class="container">
  <ef-button-bar id="SplitButton" managed>
    <ef-button id="Dislike" icon="dislike-empty"></ef-button>
    <ef-button id="Like" icon="like-empty"></ef-button>
  </ef-button-bar>
  <span id="text"></span>
</div>
<script>

const sb = document.getElementById('SplitButton');
sb.addEventListener('tap', function (e) {
  document.getElementById('text').textContent = e.target.id + ' Clicked!';
})
</script>
```

```html
<ef-button-bar id="SplitButton" managed>
    <ef-button id="Dislike" icon="dislike-empty"></ef-button>
    <ef-button id="Like" icon="like-empty"></ef-button>
</ef-button-bar>
```
```js
const sb = document.getElementById('SplitButton');
sb.addEventListener('tap', function (e) {
  console.log(e.target.getAttribute('id'));
});
```