import {
  ResponsiveElement,
  html,
  css,
  customElement,
  property,
  TemplateResult,
  CSSResult,
  PropertyValues,
  ElementSize,
  query
} from '@refinitiv-ui/core';
import { color as parseColor, RGBColor, HSLColor } from '@refinitiv-ui/utils';
import {
  createChart as chart,
  IChartApi,
  BarData,
  MouseEventParams,
  ITimeScaleApi,
  SeriesOptions,
  LineData,
  HistogramData,
  ChartOptions,
  CandlestickSeriesOptions,
  LineSeriesOptions,
  BarSeriesOptions,
  AreaSeriesOptions,
  HistogramSeriesOptions,
  BarPrices
} from 'lightweight-charts';

import '../tooltip';

import {
  TimeType,
  ConfigChart,
  ThemeInterface,
  SeriesInterface,
  SeriesStyleOptionsInterface,
  SeriesListInterface,
  SeriesDataItemInterface,
  RowLegendInterface
} from './types';

export {
  ConfigChart,
  SeriesInterface
} from './types';

/**
 * A charting component that allows you to create several use cases of financial chart.
 * By lightweight-charts library.
 * @slot legend - Slot to use for implementing custom legend.
 */
@customElement('ef-interactive-chart')
export class InteractiveChart extends ResponsiveElement {
  private static readonly CSS_COLOR_PREFIX = '--chart-color-';
  private static readonly DEFAULT_LINE_WIDTH = '2';
  private static readonly DEFAULT_FILL_OPACITY = '0.4';
  private static readonly LINE_STYLES = {
    SOLID: 0,
    DOTTED: 1,
    DASHED: 2,
    LARGE_DASHED: 3,
    SPARSE_DOTTED: 4
  };

  /**
   * Chart configurations for init chart
   * @type {ConfigChart}
  */
  @property({ type: Object })
  public config: ConfigChart | null = null;

  /**
   * Hide legend
   */
  @property({ type: Boolean, reflect: true, attribute: 'disabled-legend' })
  public disabledLegend = false;

  /**
   * Hide jump to latest data button
   */
  @property({ type: Boolean, reflect: true, attribute: 'disabled-jump-button' })
  public disabledJumpButton = false;

  /**
   * Set legend style i.e. `horizontal`, `vertical`. Default is `vertical`.
   */
  @property({ type: String, reflect: true, attribute: 'legendstyle' })
  public legendStyle: 'vertical' | 'horizontal' = 'vertical';

  /** Array of series instances in chart */
  public seriesList: SeriesListInterface[] = [];

  private jumpButtonInitialized = false;
  private legendInitialized = false;
  private isCrosshairVisible = false;

  protected chart: IChartApi | null = null;
  protected rowLegend: RowLegendInterface = null;
  private timeScale: ITimeScaleApi | null = null;

  private width = 0;
  private height = 0;
  private theme: ThemeInterface | null = null;
  private themeColors: string[] = [];

  /**
   * @returns return config of property component
   */
  protected get internalConfig (): ConfigChart {
    // Check config is available
    return this.config === null ? { series: [] } : this.config;
  }

  /**
   * chart element use for create chart.
   */
  @query('[part=chart]', true)
  private chartContainer!: HTMLElement;

  /**
   * legend element use for manage legend text inside.
   */
  @query('[part=legend]', true)
  private legendContainer!: HTMLElement;

  /**
   * jump button element use for manage scroll event.
   */
  @query('[part=jump-button-container]', true)
  private jumpButtonContainer!: HTMLElement;

  /**
   * branding element use for show trading view license
   * https://github.com/tradingview/lightweight-charts#license
   */
  @query('[part=branding-container]', true)
  private brandingContainer!: HTMLElement;

  /**
   * On Updated Lifecycle
   * @param changedProperties changed properties
   * @returns {void}
   */
  protected updated (changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('config')) {
      if (this.width && this.height && this.config) {
        this.createChart(this.width, this.height, this.config);
      }
    }

    if (changedProperties.has('disabledLegend')) {
      this.onLegendChange(this.disabledLegend);
    }

    if (changedProperties.has('disabledJumpButton')) {
      this.onJumpButtonChange(this.disabledJumpButton);
    }

    if (changedProperties.has('legendStyle')) {
      const oldLegendStyle = changedProperties.get('legendStyle') as string;
      this.onLegendStyleChange(this.legendStyle, oldLegendStyle);
    }
  }

  /**
   * Change chart size or re-create chart
   * when window size changed
   * @ignore
   * @param size new size
   * @returns {void}
   */
  public resizedCallback (size: ElementSize): void {
    super.resizedCallback(size);
    this.width = size.width;
    this.height = size.height;
    if (this.chart) {
      this.applyChartOptionSize(this.width, this.height);
    }
    else {
      this.createChart(this.width, this.height, this.config);
    }
  }

  /**
  * Legend value observer
  * @param value Legend value
  * @returns {void}
  */
  private onLegendChange (value: boolean): void {
    if (!value) {
      this.createLegend();
    }
    else {
      this.removeLegend();
    }
  }

  /**
   * Legend style observer
   * @param value Legend style value
   * @param previousValue Previous legend style value
   * @returns {void}
   */
  private onLegendStyleChange (value: string, previousValue: string): void {
    if (value === 'horizontal') {
      if (previousValue) {
        this.legendContainer.classList.remove(previousValue);
      }
      this.legendContainer.classList.add(value);
    }
    else {
      this.legendContainer.classList.remove(previousValue);
    }
  }

  /**
  * Jump last value observer
  * @param value jump last value
  * @returns {void}
  */
  private onJumpButtonChange (value: boolean): void {
    if (!value) {
      this.createJumpButton(this.width, this.height);
    }
    else {
      this.removeJumpButton();
    }
  }

  /**
   * update width and height of chart
   * @param width width of element
   * @param height height of element
   * @returns {void}
   */
  private applyChartOptionSize (width: number, height: number): void {
    if (this.chart) {
      // Resize chart after rendered.
      this.chart.applyOptions({
        width: width,
        height: height
      });
      // Render jump last button
      if (!this.disabledJumpButton) {
        this.createJumpButton(width, height);
      }
    }
  }

  /**
   * Create chart from user config
   * @param width Width component size
   * @param height Height component size
   * @param config data config
   * @returns {void}
   */
  private createChart (width: number, height: number, config: ConfigChart | null): void {
    this.destroyChart();
    if (config && width && height) {

      // init css variables
      this.themeColors = this.colors();
      this.theme = {
        backgroundColor: this.getComputedVariable('--background-color'),
        textColor: this.getComputedVariable('--text-color'),
        scalePriceBorderColor: this.getComputedVariable('--scale-price-border-color'),
        scaleTimesBorderColor: this.getComputedVariable('--scale-times-border-color'),
        gridVertLineColor: this.getComputedVariable('--grid-vert-line-color'),
        gridHorzLineColor: this.getComputedVariable('--grid-horz-line-color'),
        crossHairColor: this.getComputedVariable('--cross-hair-color'),
        chartUpColor: this.getComputedVariable('--chart-up-color'),
        chartDownColor: this.getComputedVariable('--chart-down-color'),
        fillOpacity: this.cssVarAsNumber('--fill-opacity', InteractiveChart.DEFAULT_FILL_OPACITY),
        lineWidth: this.cssVarAsNumber('--line-width', InteractiveChart.DEFAULT_LINE_WIDTH)
      };

      this.chart = chart(this.chartContainer);
      this.mergeConfig(config);
      this.applyChartOptionSize(width, height);

      if (!this.disabledLegend) {
        this.createLegend();
      }

      if (this.legendStyle === 'horizontal') {
        this.legendContainer.classList.add(this.legendStyle);
      }

      this.chart.timeScale().fitContent();

      /*
       * Fired when chart initialized
       */
      this.dispatchEvent(new CustomEvent('initialized'));
    }
  }

  /**
   * Destroy chart
   * @returns {void}
   */
  private destroyChart (): void {
    if (this.chart) {
      this.removeLegend();
      this.removeJumpButton();
      this.destroySeries();
      this.chartContainer.textContent = '';
    }
  }

  /**
   * Remove jump button
   * @returns {void}
   */
  private removeJumpButton (): void {
    if (this.chart) {
      this.jumpButtonContainer.style.display = 'none';
      this.chart.timeScale().unsubscribeVisibleTimeRangeChange(this.handleTimeRangeChange);
      this.jumpButtonContainer.removeEventListener('tap', this.handleScrollToRealTime);
      this.jumpButtonInitialized = false;
    }
  }

  /**
   * Remove legend element
   * @returns {void}
   */
  protected removeLegend (): void {
    if (this.chart) {
      this.legendContainer.textContent = '';
      this.chart.unsubscribeCrosshairMove(this.handleCrosshairMoved);
      this.legendInitialized = false;
    }
  }

  /**
   * Customize config and create chart by theme
   * @param config data configuration for create chart
   * @returns {void}
   */
  protected mergeConfig (config: ConfigChart): void {
    if (config && config.hasOwnProperty('series')) {
      this.createSeriesOptions();
      this.createSeries();
    }
    this.applyTheme(config);
    this.applyLegendTextColor();
    this.applyStylesBranding();
    this.applyStyleLegend();
  }

  /**
   * Create series
   * @returns {void}
   */
  protected createSeries (): void {
    // Loop for add multiple series
    for (let index = 0; index < this.internalConfig.series.length; index++) {
      const config = this.internalConfig.series[index];
      const series = this.addSeriesConfig(config) as SeriesListInterface;
      this.seriesList.push(series);
    }
  }

  /**
   * Destroy Series
   * @returns {void}
   */
  private destroySeries (): void {
    if (this.chart && this.seriesList && this.seriesList.length > 0) {
      for (let i = 0; i < this.seriesList.length; i++) {
        this.chart.removeSeries(this.seriesList[i]);
      }
      this.seriesList = [];
    }
  }

  /**
   * Add series to chart from config
   * @param config data configuration for add series
   * @returns series data
   */
  protected addSeriesConfig (config: SeriesInterface): SeriesListInterface | null {
    let series: SeriesListInterface | null = null;
    if (this.chart) {
      const { type, data, seriesOptions } = config;
      // Create instance series
      if (type === 'line') {
        series = this.chart.addLineSeries(seriesOptions);
      }
      else if (type === 'area') {
        series = this.chart.addAreaSeries(seriesOptions);
      }
      else if (type === 'bar') {
        series = this.chart.addBarSeries(seriesOptions);
      }
      else if (type === 'candlestick') {
        series = this.chart.addCandlestickSeries(seriesOptions);
      }
      else if (type === 'volume') {
        series = this.chart.addHistogramSeries(seriesOptions);
      }

      if (data && series) {
        series.setData(data as LineData[] & BarData[] & HistogramData[]);
      }
    }
    return series;
  }

  /**
   * Set opacity of color
   * @param color color value
   * @param opacity opacity value
   * @returns color parse
   */
  private setOpacity = (color: string, opacity?: string | number): RGBColor | HSLColor | null => {
    const colorParse = parseColor(color);
    if (colorParse && opacity !== null) {
      colorParse.opacity = Number(opacity);
    }
    return colorParse;
  }

  /**
   * Convert color to string
   * @param fn function for parse color
   * @param param value color
   * @returns color parse
   */
  private convertColorToString (fn: Function, param: string, ...args: (string|number|undefined)[]): string | object {
    return param ? fn(param, ...args).toString() : {};
  }

  /**
  * Create data configuration from theme
  * @returns {void}
  */
  private createSeriesOptions (): void {
    if (this.theme) {
      let colorIndex = 0;

      for (let index = 0; index < this.internalConfig.series.length; index++) {

        // Get seriesOptions and type
        const seriesOptions = this.internalConfig.series[index].seriesOptions as SeriesOptions<SeriesStyleOptionsInterface> || {};
        const type = this.internalConfig.series[index].type;

        let seriesThemeOptions = {};
        const colorCycle = this.convertColorToString(parseColor, this.themeColors[colorIndex]);

        if (type === 'line') {
          seriesThemeOptions = {
            lineWidth: this.theme.lineWidth,
            color: colorCycle
          };
          // Update color index
          if (!seriesOptions.color) {
            colorIndex++;
          }
        }
        else if (type === 'area') {
          seriesThemeOptions = {
            lineWidth: this.theme.lineWidth,
            lineColor: this.convertColorToString(parseColor, this.themeColors[colorIndex]),
            topColor: this.convertColorToString(this.setOpacity, this.themeColors[colorIndex], this.theme.fillOpacity),
            bottomColor: this.convertColorToString(this.setOpacity, this.themeColors[colorIndex], '0')
          };
          // Update color index
          if (!seriesOptions.lineColor || !seriesOptions.topColor || !seriesOptions.bottomColor) {
            colorIndex++;
          }
        }
        else if (type === 'bar') {
          seriesThemeOptions = {
            upColor: colorCycle,
            downColor: colorCycle
          };
          // Update color index
          if (!seriesOptions.upColor || !seriesOptions.downColor) {
            colorIndex++;
          }
        }
        else if (type === 'candlestick') {
          seriesThemeOptions = {
            upColor: this.theme.chartUpColor,
            downColor: this.theme.chartDownColor,
            borderUpColor: this.theme.chartUpColor,
            borderDownColor: this.theme.chartDownColor,
            wickUpColor: this.theme.chartUpColor,
            wickDownColor: this.theme.chartDownColor
          };

          // Update color index
          if (!seriesOptions.upColor
            || !seriesOptions.downColor
            || !seriesOptions.borderUpColor
            || !seriesOptions.borderDownColor
            || !seriesOptions.wickUpColor
            || !seriesOptions.wickDownColor
          ) {
            colorIndex++;
          }

        }
        else if (type === 'volume') {

          seriesThemeOptions = {
            color: colorCycle
          };
          // Update color index
          if (!seriesOptions.color) {
            colorIndex++;
          }
        }
        // Update config seriesOptions not have seriesOptions
        if (!this.internalConfig.series[index].seriesOptions) {
          this.internalConfig.series[index].seriesOptions = seriesThemeOptions as SeriesOptions<SeriesStyleOptionsInterface>;
        }
        else {
          this.mergeObjects(seriesOptions, seriesThemeOptions);
        }
      }
    }
  }

  /**
  * Apply Theme to chart
  * @param config value config
  * @returns {void}
  */
  private applyTheme (config: ConfigChart): void {
    if (this.chart && this.theme) {
      const style = getComputedStyle(this);
      const defaultFontFamily = style.getPropertyValue('font-family');

      // Create object has a property object before comparing config the theme
      const chartOptions = config.options || {};

      // Create object same as the theme
      const chartThemeOptions = {
        layout: {
          backgroundColor: this.theme.backgroundColor,
          textColor: this.theme.textColor,
          fontFamily: defaultFontFamily
        },
        priceScale: {
          borderColor: this.theme.scalePriceBorderColor
        },
        timeScale: {
          borderColor: this.theme.scaleTimesBorderColor,
          rightOffset: 1
        },
        grid: {
          vertLines: {
            color: this.theme.gridVertLineColor,
            style: InteractiveChart.LINE_STYLES.SOLID
          },
          horzLines: {
            color: this.theme.gridHorzLineColor,
            style: InteractiveChart.LINE_STYLES.SOLID
          }
        },
        crosshair: {
          vertLine: {
            color: this.theme.crossHairColor
          },
          horzLine: {
            color: this.theme.crossHairColor
          }
        }
      };

      this.mergeObjects(chartOptions, chartThemeOptions);

      if (!config.options) {
        this.chart.applyOptions(chartThemeOptions);
      }
      else {
        // Apply config when has option for custom
        this.applyLegendTextColor();
        this.chart.applyOptions(config.options);
      }
    }
  }

  /**
   * Apply text color legend from chart options
   * @returns {void}
   */
  private applyLegendTextColor (): void {
    if (this.chart) {
      const options = this.chart.options();
      if (options && options.hasOwnProperty('layout') && options.layout.hasOwnProperty('textColor')) {
        this.legendContainer.style.color = options.layout.textColor;
      }
    }
  }

  /**
   * Get position config for set position legend
   * @returns {void}
   */
  private applyStyleLegend (): void {
    if (this.chart) {
      // Get position config for set position legend
      const position = this.getPriceScalePosition();
      if (position === 'left' || position === 'two-price') {
        this.legendContainer.className = 'yaxis-left';
      }
      else {
        this.legendContainer.className = 'yaxis-right';
      }
    }
  }

  /**
   * Get position config for set position logo trading view on chart
   * @returns {void}
   */
  private applyStylesBranding (): void {
    if (this.chart) {
      const position = this.getPriceScalePosition();
      this.brandingContainer.className = position === 'two-price' ? 'right' : position;
    }
  }

  /**
   * Get price scale position
   * @return position
   */
  private getPriceScalePosition (): string {
    const priceScale = this.chart?.options() as ChartOptions;
    if(priceScale.leftPriceScale.visible && priceScale.rightPriceScale.visible) {
      return 'two-price';
    }
    else if(priceScale.leftPriceScale.visible) {
      return 'left';
    }
    else if(priceScale.rightPriceScale.visible) {
      return 'right';
    }
    else {
      return 'none';
    }
  }

  /**
   * Handle MouseEventHandler
   * on event subscribeCrosshairMove
   * for create row legend
   * @param param MouseEventParams
   * @returns {void} return undefined has out of boundary chart
   */
  private handleCrosshairMoved = (param: MouseEventParams): void => {
    if (!param) {
      return;
    }
    this.createRowLegend(this.rowLegend, param);
  }

  /**
   * Create legend element
   * @returns {void}
   */
  protected createLegend (): void {
    if (this.chart && !this.legendInitialized && this.internalConfig.hasOwnProperty('series')) {
      this.createRowLegend();
      if(this.shadowRoot) {
        this.rowLegend = this.shadowRoot.querySelectorAll('.row');
      }
      this.chart.subscribeCrosshairMove(this.handleCrosshairMoved);
      this.legendInitialized = true;
    }
  }

  /**
   * Create legend element or update value in legend element
   * @param rowLegend Legend element
   * @param eventMove Event mouse move on chart
   * @return {void}
   */
  private createRowLegend (rowLegend?: RowLegendInterface, eventMove?: MouseEventParams): void {
    let rowLegendElem: HTMLElement;
    for (let idx = 0; idx < this.internalConfig.series.length; idx++) {
      const chartType = this.internalConfig.series[idx].type;
      const dataSet = this.internalConfig.series[idx].data || [];
      const symbol = (this.internalConfig.series[idx].symbolName || this.internalConfig.series[idx].symbol) || '';

      // Create row legend element
      if (!rowLegend) {
        rowLegendElem = document.createElement('div');
        rowLegendElem.setAttribute('class', 'row');
        this.createTextSymbol(rowLegendElem, symbol);

        if (dataSet.length) {
          const lastData = dataSet[dataSet.length - 1];
          const priceColor = this.getColorInSeries(lastData, chartType, idx);
          const lastDataValue = chartType === 'bar' || chartType === 'candlestick' ? lastData : (lastData as LineData).value;

          this.renderTextLegend(chartType, rowLegendElem, lastDataValue, priceColor, idx);
        }
        else {
          const span = document.createElement('span');
          span.className = 'price';
          span.textContent = 'N/A';
          rowLegendElem.appendChild(span);
        }

        this.legendContainer.appendChild(rowLegendElem);
      }
      /* Update value legend element on subscribeCrosshairMove.
       * Don't need to be updated if chart has no data.
       */
      else if (rowLegend && dataSet.length) {
        let value;
        let priceColor = '';
        // When have price on event moved on the crosshair
        if (eventMove?.seriesPrices.get(this.seriesList[idx]) && eventMove.time) {
          value = eventMove.seriesPrices.get(this.seriesList[idx]);
          priceColor = this.getColorInSeries(eventMove, chartType, idx);
          this.isCrosshairVisible = true;
        }
        // Get latest value when mouse move out of scope
        else {
          const latestData = dataSet[dataSet.length - 1];
          if(latestData) {
            priceColor = this.getColorInSeries(latestData, chartType, idx);
            value = chartType === 'bar' || chartType === 'candlestick' ? latestData : (latestData as LineData).value;
            this.isCrosshairVisible = false;
          }
        }
        // Render legend by series type
        this.renderTextLegend(chartType, rowLegend, value as number, priceColor, idx);
      }
    }
  }

  /**
   * Render text legend in row legend
   * @param chartType chart type of series
   * @param rowLegendElem row legend div element
   * @param value value of series
   * @param priceColor price color of series
   * @param index index of series
   * @returns {void}
   */
  protected renderTextLegend (chartType: string, rowLegendElem: RowLegendInterface, value: SeriesDataItemInterface | number, priceColor: string, index: number): void {
    if (chartType === 'bar' || chartType === 'candlestick') {
      this.createTextOHLC(rowLegendElem, value as BarData, priceColor, index);
    }
    else {
      this.createTextPrice(rowLegendElem, value as number, priceColor, index);
    }
  }

  /**
  * Check `node` inside row legend and case type to HTMLElement
  * @param rowLegend Legend element
  * @returns true if not have `node` inside row legend
  */
  private isHTMLElement (rowLegend: RowLegendInterface): rowLegend is HTMLElement {
    return (rowLegend as NodeListOf<Element>).length === undefined;
  }

  /**
  * Check `node` inside row legend and case type to NodeListOf<Element>
  * @param rowLegend Legend element
  * @returns true if have `node` inside row legend
  */
  private isNodeListElement (rowLegend: RowLegendInterface): rowLegend is NodeListOf<Element> {
    return (rowLegend as NodeListOf<Element>) !== undefined;
  }

  /**
   * Create span OHLC in row legend used by several series types such as bars or candlesticks
   * @param rowLegend Legend element
   * @param rowData Value of series
   * @param priceColor Color of series
   * @returns {void}
   */
  private createSpanOHLC (rowLegend: RowLegendInterface, rowData: BarData, priceColor: string): void {
    if(this.isHTMLElement(rowLegend)) {
      rowLegend.setAttribute('data-color', priceColor);
      this.createSpan(rowLegend, 'O', rowData.open, 'H', rowData.high, 'L', rowData.low, 'C', rowData.close);
    }
  }

  /**
  * Create text used by several series types such as bars or candlesticks
  * @param rowLegend Legend element
  * @param rowData Value of series
  * @param priceColor color of series
  * @param index Series index
  * @returns {void}
  */
  private createTextOHLC (rowLegend: RowLegendInterface, rowData: BarData, priceColor: string, index: number): void {
    // Uses price formatter if provided
    const formatter = this.internalConfig.series[index].hasOwnProperty('legendPriceFormatter') ? this.internalConfig.series[index].legendPriceFormatter : null;
    if(formatter) {
      rowData = {
        open: formatter(rowData.open),
        high: formatter(rowData.high),
        low: formatter(rowData.low),
        close: formatter(rowData.close)
      } as BarData;
    }

    // Create text price after chart has rendered
    if (this.isHTMLElement(rowLegend)) {
      this.createSpanOHLC(rowLegend, rowData, priceColor);
    }
    // Handle update text price when mouse crosshairMove in chart
    else if (this.isNodeListElement(rowLegend)) {
      const rowSpanLength = rowLegend[index].children.length;
      let countElmPrice = 0;
      for (let spanIndex = 0; spanIndex < rowSpanLength; spanIndex++) {
        const spanElem = rowLegend[index].children[spanIndex] as HTMLElement;

        // Create a new row the previous time there was no data.
        if(spanElem.textContent === 'N/A') {
          rowLegend[index].removeChild(spanElem);
          this.createSpanOHLC(rowLegend[index] as HTMLElement, rowData, priceColor);
        }
        else if (spanElem.getAttribute('class') === 'price') {
          // Set price color
          spanElem.style.color = priceColor;
          // Set value OHLC BY price
          if (countElmPrice === 0) {
            spanElem.textContent = `${rowData.open}`;
          }
          else if (countElmPrice === 1) {
            spanElem.textContent = `${rowData.high}`;
          }
          else if (countElmPrice === 2) {
            spanElem.textContent = `${rowData.low}`;
          }
          else if (countElmPrice === 3) {
            spanElem.textContent = `${rowData.close}`;
          }
          // Update next span by price
          countElmPrice++;
        }
      }
    }
  }

  /**
   * Create text price used by several series types
   * @param rowLegend Legend element
   * @param price Value of series
   * @param priceColor color of series
   * @param index Series index
   * @returns {void}
   */
  private createTextPrice (rowLegend: RowLegendInterface, price: number, priceColor: string, index: number): void {
    // Uses price formatter if provided
    const formatter = this.internalConfig.series[index].hasOwnProperty('legendPriceFormatter') ? this.internalConfig.series[index].legendPriceFormatter : null;
    price = formatter ? formatter(price) : price;

    // Create text price after chart has rendered
    if (this.isHTMLElement(rowLegend)) {
      rowLegend.setAttribute('data-color', priceColor);
      this.createSpan(rowLegend, price);
    }
    // Handle update text price when mouse crosshairMove in chart
    else if (this.isNodeListElement(rowLegend)) {
      const symbolElem = rowLegend[index].children[0];
      const spanIndex = symbolElem.getAttribute('class')?.indexOf('symbol') === 0 ? 1 : 0;
      const rowLegendElem = rowLegend[index];
      rowLegendElem.children[spanIndex].textContent = `${price}`;
      (rowLegendElem.children[spanIndex] as HTMLElement).style.color = `${priceColor}`;
    }
  }

  /**
   * Create span in legend element by several series types
   * @param args text value
   * @returns {void}
   */
  private createSpan (...args: (string | number | HTMLElement)[]): void {
    const div = args[0] as HTMLElement; // rowLegend
    const arg = args;
    const len = args.length;
    const color = div.getAttribute('data-color') as string;
    for (let idx = 1; idx < len; idx++) {
      const span = document.createElement('span');
      span.textContent = `${arg[idx]}`;
      // Set class by Text O H L C
      if (['O', 'H', 'L', 'C'].includes(`${arg[idx]}`)) {
        span.setAttribute('class', 'ohlc');
      }
      else {
        span.setAttribute('class', 'price');
        span.style.color = color;
      }
      div.appendChild(span);
    }
  }

  /**
   * Create span in legend element by several series types
   * @param rowLegend Legend element
   * @param symbol Value naming for show
   * @returns {void}
   */
  private createTextSymbol (rowLegend: HTMLElement, symbol: string): void {
    if (rowLegend.children && symbol) {
      const symbolElem = document.createElement('span');
      symbolElem.setAttribute('class', 'symbol');
      symbolElem.textContent = symbol + ' : ';
      rowLegend.appendChild(symbolElem);
    }
  }

  /**
   * Get legend price color
   * @param color color code
   * @returns rgba or hex color
   */
  private getLegendPriceColor (color: string): string {
    // check color is does not blend with the background
    if(color === 'rgba(0,0,0,0)' || color === 'transparent') {
      return this.getComputedVariable('--text-color');
    }
    return color;
  }

  /**
   * Get Color in series
   * @param seriesData series data or event mouse move on chart
   * @param chartType type of chart
   * @param index index of list series
   * @returns color value
   */
  protected getColorInSeries (seriesData: SeriesDataItemInterface | MouseEventParams, chartType: string, index: number): string {
    if(chartType === 'line') {
      return this.getLegendPriceColor((this.seriesList[index].options() as LineSeriesOptions).color);
    }
    else if(chartType === 'candlestick') {
      const value = seriesData.hasOwnProperty('seriesPrices') ? (seriesData as MouseEventParams)?.seriesPrices.get(this.seriesList[index]) as BarPrices : seriesData as BarData;
      const barStyle = this.seriesList[index].options() as CandlestickSeriesOptions;
      const colorBar = value.close > value.open ? barStyle.borderUpColor : barStyle.borderDownColor;
      return colorBar;
    }
    else if(chartType === 'bar') {
      return this.getLegendPriceColor((this.seriesList[index].options() as BarSeriesOptions).upColor);
    }
    else if(chartType === 'area') {
      return this.getLegendPriceColor((this.seriesList[index].options() as AreaSeriesOptions).lineColor);
    }
    else if(chartType === 'volume') {
      const priceValue = seriesData.hasOwnProperty('seriesPrices') ? (seriesData as MouseEventParams).seriesPrices.get(this.seriesList[index]) as BarPrices : (seriesData as HistogramData).value;

      let dataItem = {};
      this.internalConfig.series[index].data.forEach((dataConfig: BarData | HistogramData) => {
        const data = dataConfig as HistogramData;
        const time = data.time as TimeType;
        const timeSeriesData = seriesData.time as TimeType;
        //  if via time point data string format 'yyyy-mm-dd' or object '{ year: 2019, month: 6, day: 1 }'
        if(time.hasOwnProperty('day') && time.hasOwnProperty('month') && time.hasOwnProperty('year')) {
          if(time.day === timeSeriesData.day
            && time.month === timeSeriesData.month
            && time.year === timeSeriesData.year
            && data.value === priceValue) {
            dataItem = dataConfig;
          }
        }
        // if via config time uses a UNIX Timestamp format for time point data.
        else if(time === seriesData.time) {
          dataItem = data;
        }
      });

      // check when each color is added, the item comes from the configuration
      if(dataItem.hasOwnProperty('color')) {
        const data = dataItem as HistogramData;
        return this.getLegendPriceColor(data.color as string);
      }
      else {
        return this.getLegendPriceColor((this.seriesList[index].options() as HistogramSeriesOptions).color);
      }
    }
    return '';
  }

  /**
   * Create button that will make window scroll to the last data
   * in the chart when clicked
   * @param width Width component size
   * @param height Hight component size
   * @returns {void}
   */
  private createJumpButton (width: number, height: number): void {
    if (this.chart && this.jumpButtonContainer) {

      this.timeScale = this.chart.timeScale();

      // Get position config for set position jump last button
      const position = this.getPriceScalePosition();
      const pricePosition = position === 'left' ? 30 : 0;

      const buttonTop = `${height - 70}px`;
      const buttonLeft = `${(width + pricePosition) - 100}px`;

      this.jumpButtonContainer.style.top = buttonTop;
      this.jumpButtonContainer.style.left = buttonLeft;

      // Create subscribeVisibleTimeRangeChange
      if (!this.jumpButtonInitialized) {
        this.chart.timeScale().subscribeVisibleTimeRangeChange(this.handleTimeRangeChange);
        this.jumpButtonContainer.addEventListener('tap', this.handleScrollToRealTime);
        this.jumpButtonInitialized = true;
      }
    }
  }

  /**
   *  Handle TimeRangeChangeEventHandler
   *  on event subscribeVisibleTimeRangeChange
   *  for create jump last button
   *  @returns {void}
   */
  private handleTimeRangeChange = (): void => {
    let buttonVisible = false;
    if (this.timeScale) {
      buttonVisible = this.timeScale.scrollPosition() < 0;
    }
    this.jumpButtonContainer.style.display = buttonVisible ? 'block' : 'none';
    // when update data in series then should always show last value
    if(this.internalConfig.series.length === this.seriesList.length) {
      // update legend only when chart already created
      this.updateLegendWithLatestData();
    }
  }

  /**
   *  Update Legend with latest data on update data in series
   *  @returns {void}
   */
  private updateLegendWithLatestData (): void {
    if (this.rowLegend && !this.isCrosshairVisible && this.config?.hasOwnProperty('series')) {
      for (let idx = 0; idx < this.internalConfig.series.length; idx++) {
        const chartType = this.internalConfig.series[idx].type;
        const series = this.internalConfig.series[idx];
        const dataSet = series.data || [];
        const latestData = dataSet[dataSet.length - 1];
        if(latestData) {

          const value = chartType === 'bar' || chartType === 'candlestick' ? latestData : (latestData as LineData).value; // latestData
          const priceColor = this.getColorInSeries(latestData, chartType, idx);

          // Render legend by series type
          this.renderTextLegend(chartType, this.rowLegend, value, priceColor, idx);
        }
      }
    }
  }

  /**
   *  Handle event clicked scroll to realtime
   *  @returns {void}
   */
  private handleScrollToRealTime = (): void => {
    if (this.timeScale !== null) {
      this.timeScale.scrollToRealTime();
    }
  }

  /**
   * Get as CSS variable and tries to convert it into a usable number
   * @param args param css variable
   * @returns The value as a number, or, undefined if NaN.
   */
  private cssVarAsNumber (...args: string[]): number | undefined {
    args[args.length] = '';
    const cssComputeVar = this.getComputedVariable(...args);
    const result = parseFloat(cssComputeVar.replace(/\D+$/, ''));
    return cssComputeVar && !isNaN(result) ? result : undefined;
  }

  /**
   * List of available chart colors from the theme.
   * @returns list of available chart colors from the theme.
   */
  public colors (): string[] {
    let color;
    let index = 0;
    const colors: string[] = [];
    while ((color = this.getComputedVariable(`${InteractiveChart.CSS_COLOR_PREFIX}${(index += 1)}`))) {
      const parseColorCode = parseColor(color);
      if (parseColorCode !== null) {
        colors.push(parseColorCode.toString());
      }
    }
    return colors;
  }

  /**
   * Merges properties of one object into another.
   * @param a Object to merge into
   * @param b Object to merge from
   * @param force Force apply the change
   * @param record Record of objects, to check for circular references
   * @returns {void}
   */
  private mergeObjects (a: object, b: object, force = false, record: object[] = []): void {
    let value;
    let isObject;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    Object.keys(b).forEach(key => {
      value = (b as any)[key];
      isObject = value && value.toString() === '[object Object]';
      if (!(key in a) || (!isObject && force)) {
        (a as any)[key] = (b as any)[key];
      }
      if (isObject && !record.includes(value as never)) {
        record.push((b as any)[key]);
        this.mergeObjects((a as any)[key], (b as any)[key], force, record);
      }
    });
  }

  /**
  * A `CSSResult` that will be used
  * to style the host, slotted children
  * and the internal template of the element.
  * @return CSS template
  */
  static get styles (): CSSResult | CSSResult[] {
    return css`
      :host {
        display: block;
        position: relative;
        height: 300px;
        z-index: 0;
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
      <slot name="legend">
        <div part="legend"></div>
      </slot>
      <div part="jump-button-container">
        <div part="jump-button"></div>
      </div>
      <div part="branding-container" title="" tooltip="Powered by Trading View">
        <svg viewBox="0 0 33 19" part="branding">
          <path d="M29.0317379,7.38247569 C29.5989701,8.20545373 29.9478191,9.19057395 29.9946037,10.2541551 C31.7452105,10.8703835 33,12.5386559 33,14.5 C33,16.9852814 30.9852814,19 28.5,19 L6,19 C4.35376245,19 2.86237543,18.3370061 1.7782826,17.2634619 L11.3238065,9.70658883 C11.6743726,9.89384408 12.0747893,10 12.5,10 C12.8814296,10 13.242908,9.91457903 13.5663489,9.76182351 L18.1165746,13.743271 C18.0408521,13.9819846 18,14.2362216 18,14.5 C18,15.8807119 19.1192881,17 20.5,17 C21.8807119,17 23,15.8807119 23,14.5 C23,14.1775704 22.9389612,13.8693971 22.8278086,13.586405 L29.0317379,7.38247569 Z M27.6175243,5.96826213 L21.413595,12.1721914 C21.1306029,12.0610388 20.8224296,12 20.5,12 C20.1185704,12 19.757092,12.085421 19.4336511,12.2381765 L14.8834254,8.25672903 C14.9591479,8.01801537 15,7.76377844 15,7.5 C15,6.11928813 13.8807119,5 12.5,5 C11.1192881,5 10,6.11928813 10,7.5 C10,7.72070771 10.0286003,7.93473545 10.082297,8.13857926 L0.609477485,15.6378947 C0.219150823,14.8417652 0,13.9464753 0,13 C0,9.6862915 2.6862915,7 6,7 C6.02064279,7 6.04126123,7.00010425 6.06185483,7.00031224 C6.55381427,3.0538495 9.92027475,0 14,0 C17.6455896,0 20.7216389,2.43849213 21.6860468,5.77337533 C22.5093073,5.28219823 23.4716982,5 24.5,5 C25.6574983,5 26.7314831,5.35756404 27.6175243,5.96826213 Z"></path>
        </svg>
      </div>
      <div part="chart"></div>
    `;
  }
}