import {
  html,
  css,
  customElement,
  property,
  TemplateResult,
  CSSResult,
  PropertyValues,
  query,
  ResponsiveElement,
  ElementSize
} from '@refinitiv-ui/core';
import { Tab } from '../tab';
import { tweenAnimate } from './helpers/animate';
import { Button } from '../button';
import '../button';

const BAR_TRAVEL_DISTANCE = 150; // scroll distance

/**
 * Container for tabs
 */
@customElement('ef-tab-bar')
export class TabBar extends ResponsiveElement {
  @query('[part="content"') private content!: HTMLElement;
  @query('[part="left-btn"]') private leftBtn!: Button;
  @query('[part="right-btn"]') private rightBtn!: Button;


  /**
   * Specify tab's horizontal alignment
   */
  @property({ type: String, reflect: true })
  public alignment: 'left' | 'center' | 'right' = 'left';

  /**
   * Use level styling from theme
   */
  @property({ type: String, reflect: true }) level = '1';

  /**
   * Use to switch from horizontal to vertical layout.
   */
  @property({ type: Boolean, reflect: true }) vertical = false;

  private isScrolling!: NodeJS.Timeout; // timer id

  /**
   * Called after the element’s DOM has been updated the first time.
   * register scroll event on content element to toggle scroll button
   * @param changedProperties Properties that has changed
   * @returns {void}
   */
  protected firstUpdated (changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.content.addEventListener('scroll', () => {
      // Clear our timeout throughout the scroll
      clearTimeout(this.isScrolling);
      // Set a timeout to run after scrolling ends
      this.isScrolling = setTimeout(() => {
        this.toggleScrollButton(this.content.clientWidth);
      }, 66); // equal 15 fps for compatibility
    });
  }

  /**
   * Called when the element’s DOM has been updated and rendered
   * @param changedProperties Properties that has changed
   * @returns {void}
   */
  protected updated (changedProperties: PropertyValues): void {
    /* istanbul ignore else */
    if (changedProperties.has('level')) {
      this.setLevel();
    }
    if (changedProperties.has('vertical')) {
      // if tab bar changed from horizontal to vertical
      if(this.vertical) {
        this.hideScrollButtons();
      }
    }
    super.updated(changedProperties);
  }

  /**
   * private method but can't override
   * access modifiers in typescript.
   * @ignore
   * @param size element dimensions
   * @returns {void}
   */
  resizedCallback (size: ElementSize): void {
    if(!this.vertical) {
      this.toggleScrollButton(size.width);
    }
    /**
     * Resize fired when the element's size changes.
     */
    this.dispatchEvent(
      new CustomEvent('resize', {
        bubbles: false,
        cancelable: false,
        detail: size
      })
    );
  }

  /**
   * Hide all scroll buttons
   * @returns {void}
   */
  private hideScrollButtons (): void {
    this.leftBtn.style.setProperty('display', 'none');
    this.rightBtn.style.setProperty('display', 'none');
  }

  /**
   * Hide/Show scroll button when element is overflow.
   * @param elementWidth width of element
   * @returns {void}
   */
  private toggleScrollButton (elementWidth: number): void {
    const { scrollLeft, scrollWidth } = this.content;

    if(this.vertical) {
      return;
    }

    // handle left button
    if(scrollLeft > 0) {
      this.leftBtn.style.setProperty('display', 'flex');
    }
    else {
      this.leftBtn.style.setProperty('display', 'none');
    }

    // handle right button
    if(Math.floor(scrollWidth - scrollLeft) > Math.round(elementWidth)) {
      this.rightBtn.style.setProperty('display', 'flex');
    }
    else {
      this.rightBtn.style.setProperty('display', 'none');
    }
  }

  /**
   * Set tab level attribute accordingly
   * @returns {void}
   */
  private setLevel (): void {
    const tabList: NodeListOf<Tab> = this.querySelectorAll('ef-tab');

    tabList.forEach((tab: Tab) => {
      tab.level = this.level;
    });
  }

  /**
   * Detects when slot changes
   * @returns {void}
   */
  private onSlotChange (): void {
    this.setLevel();
  }

  /**
   * Update scroll position when clicked on left button
   * @returns {void}
   */
  private handleScrollLeft (): void {
    const { scrollLeft } = this.content;
    const availableScrollLeft = scrollLeft;
    let endPosition = scrollLeft - BAR_TRAVEL_DISTANCE;

    // If the space available is less than one half lots of our desired distance, just move to the leftest
    if(availableScrollLeft < BAR_TRAVEL_DISTANCE * 1.5) {
      endPosition = 0;
    }

    tweenAnimate({ target: this.content, startPosition: scrollLeft, endPosition });
  }

  /**
   * Update scroll position when clicked on right button
   * @returns {void}
   */
  private handleScrollRight (): void {
    const { scrollLeft, scrollWidth, clientWidth } = this.content;
    const availableScrollRight = scrollWidth - (scrollLeft + clientWidth);
    let endPosition = scrollLeft + BAR_TRAVEL_DISTANCE;

    // If the space available is less than one half lots of our desired distance, just move the whole amount
    if(availableScrollRight < BAR_TRAVEL_DISTANCE * 1.5) {
      endPosition = scrollLeft + availableScrollRight;
    }

    tweenAnimate({ target: this.content, startPosition: scrollLeft, endPosition });
  }

  /**
   * A `CSSResult` that will be used
   * to style the host, slotted children
   * and the internal template of the element.
   * @returns CSS template
   */
  static get styles (): CSSResult | CSSResult[] {
    return css`
      :host {
        display: flex;
      }
      :host([alignment=center]) {
        justify-content: center;
      }
      :host([alignment=right]) {
        justify-content: flex-end;
      }
    `;
  }

  /**
   * A `TemplateResult` that will be used
   * to render the updated internal template.
   * @return Render template
   */
  protected render (): TemplateResult {
    return html`
    <ef-button icon="left" part="left-btn" @tap=${this.handleScrollLeft}></ef-button>
      <div part="content">
        <slot @slotchange=${this.onSlotChange}></slot>
      </div>
    <ef-button icon="right" part="right-btn" @tap=${this.handleScrollRight}></ef-button>
    `;
  }
}