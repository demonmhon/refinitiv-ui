# `color-dialog/ColorDialog`

## `Default Color Dialog`

####   `DOM structure is correct`

```html
<ef-header
  drag-handle=""
  level="2"
  part="header"
  style="cursor: move;"
>
  Color Picker
  <ef-icon
    icon="cross"
    part="close"
    slot="right"
  >
  </ef-icon>
</ef-header>
<ef-panel
  part="content"
  spacing=""
  transparent=""
>
  <div part="content-section">
    <div part="palettes-container">
      <ef-color-palettes part="color-palettes">
      </ef-color-palettes>
      <ef-grayscale-palettes part="grayscale-palettes">
      </ef-grayscale-palettes>
    </div>
    <div part="inputs-container">
      <div
        no-color=""
        part="preview-color"
        style=""
      >
      </div>
      <div>
        R :
        <ef-number-field
          aria-disabled="false"
          aria-readonly="false"
          id="redInput"
          max="255"
          min="0"
          no-spinner=""
          part="color-input"
        >
        </ef-number-field>
      </div>
      <div>
        G :
        <ef-number-field
          aria-disabled="false"
          aria-readonly="false"
          id="greenInput"
          max="255"
          min="0"
          no-spinner=""
          part="color-input"
        >
        </ef-number-field>
      </div>
      <div>
        B :
        <ef-number-field
          aria-disabled="false"
          aria-readonly="false"
          id="blueInput"
          max="255"
          min="0"
          no-spinner=""
          part="color-input"
        >
        </ef-number-field>
      </div>
      <div>
        # :
        <ef-text-field
          aria-disabled="false"
          aria-readonly="false"
          icon=""
          id="hexInput"
          maxlength="6"
          part="color-input"
          pattern="^([0-9a-fA-F]{3}){1,2}$"
        >
        </ef-text-field>
      </div>
    </div>
  </div>
</ef-panel>
<div part="footer">
  <ef-button
    aria-disabled="true"
    aria-readonly="false"
    cta=""
    disabled=""
    id="confirmButton"
    part="button"
    style="pointer-events: none;"
    textpos="after"
  >
    Apply
  </ef-button>
  <ef-button
    aria-disabled="false"
    aria-readonly="false"
    id="closeButton"
    part="button"
    textpos="after"
  >
    Close
  </ef-button>
</div>

```
