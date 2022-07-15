import {
  BasicElement,
  CSSResultGroup,
  TemplateResult,
  PropertyValues,
  html,
  css
} from '@refinitiv-ui/core';
import { customElement } from '@refinitiv-ui/core/decorators/custom-element.js';
import { property } from '@refinitiv-ui/core/decorators/property.js';
import { VERSION } from '../version.js';
import '../icon/index.js';

enum Alignment {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

interface GridColumn {
  title: string,
  field: string,
  width?: number,
  minWidth?: number,
  alignment?: Alignment
}

interface GridDataModel {
  fields: string[],
  data: string[][],
}

interface GridConfig {
  columns: GridColumn[],
  dataModel: GridDataModel,
}

@customElement('ef-grid-lite')
export class GridLite extends BasicElement {
  /**
   * Element version number
   * @returns version number
   */
  static get version (): string {
    return VERSION;
  }

  /**
   * Style definition
   * @return CSS template
   */
  static get styles (): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
    `;
  }

  /**
   * Invoked whenever the element is updated
   * @param {PropertyValues} changedProperties Map of changed properties with old values
   * @returns {void}
   */
  protected updated (changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    // Call this.updateStyles() to update css variables
    if (changedProperties.has('state')) {
      this.updateStyles();
    }
  }

  @property() config: GridConfig = {
    columns: [],
    dataModel: {
      fields: [],
      data: []
    }
  };

  private tableHeader (): TemplateResult {
    const headers = this.config?.columns.map(col => {
      return (
        html`
          <th>
            <div class="cell header-cell">${col.title}</div>
          </th>
        `
      );
    });
    return html` <thead><tr>${headers}</tr></thead> `;
  }

  private tableBody (): TemplateResult {
    const rows = this.config?.dataModel?.data.map(row => {
      const cols = row.map(col => (html`<td><div class="cell body-cell">${col}<div></td>`));
      return html`<tr>${cols}</tr>`;
    });
    return html`<tbody>${rows}</tbody>`;
  }

  protected render () {
    return html`
      <table>
        ${this.tableHeader()}
        ${this.tableBody()}
      </table>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ef-grid-lite': GridLite;
  }
}
