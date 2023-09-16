// This source code is subject to the terms of the Mozilla Public License 2.0 at https://mozilla.org/MPL/2.0/
// © TradingView

//@version=5
library("ZigZag", overlay = true)

// ZigZag Library
// v3, 2022.12.20

// This code was written using the recommendations from the Pine Script™ User Manual's Style Guide:
//   https://www.tradingview.com/pine-script-docs/en/v5/writing/Style_guide.html



//#region ———————————————————— Inputs


float  deviationInput = input.float(5.0,         "Deviation (%)",                       minval = 0.00001, maxval = 100.0)
int    depthInput     = input.int(10,            "Depth",                               minval = 1)
color  lineColorInput = input.color(#2962FF,   "Line Color")
bool   extendInput    = input.bool(true,         "Extend to Last Bar")
bool   showPriceInput = input.bool(true,         "Display Reversal Price")
bool   showVolInput   = input.bool(true,         "Display Cumulative Volume")
bool   showChgInput   = input.bool(true,         "Display Reversal Price Change",       inline = "Price Rev")
string priceDiffInput = input.string("Absolute", "", options = ["Absolute", "Percent"], inline = "Price Rev")
//#endregion



//#region ———————————————————— Library functions


// @type                                Provides calculation and display attributes to ZigZag objects. 
// @field devThreshold                  The minimum percentage deviation from a point before the ZigZag will change direction. 
// @field depth                         The number of bars required for pivot detection. 
// @field lineColor                     Line color. 
// @field extendLast                    Condition allowing a line to connect the most recent pivot with the current close. 
// @field displayReversalPrice          Condition to display the pivot price in the pivot label. 
// @field displayCumulativeVolume       Condition to display the cumulative volume for the pivot segment in the pivot label. 
// @field displayReversalPriceChange    Condition to display the change in price or percent from the previous pivot in the pivot label. 
// @field differencePriceMode           Reversal change display mode. Options are "Absolute" or "Percent". 
// @field draw                          Condition to display lines and labels. 
export type Settings
    float  devThreshold = 5.0
    int    depth = 10
    color  lineColor = #2962FF
    bool   extendLast = true
    bool   displayReversalPrice = true
    bool   displayCumulativeVolume = true
    bool   displayReversalPriceChange = true
    string differencePriceMode = "Absolute"
    bool   draw = true


// @type                A coordinate containing bar, price, and time information.  
// @field tm            A value in UNIX time. 
// @field price         A value on the Y axis (price). 
// @field barIndex      A `bar_index`. 
export type Point
    int   tm
    float price
    int   barIndex


// @type                A level of significance used to determine directional movement or potential support and resistance.
// @field ln            A line object connecting the `start` and `end` Point objects. 
// @field lb            A label object to display pivot values. 
// @field isHigh        A condition to determine if the pivot is a pivot high. 
// @field vol           Volume for the pivot segment. 
// @field start         The coordinate of the previous Point.
// @field end           The coordinate of the current Point.
export type Pivot
    line  ln
    label lb
    bool  isHigh 
    float vol
    Point start
    Point end


// @type                An object to maintain Zig Zag settings, pivots, and volume. 
// @field settings      Settings object to provide calculation and display attributes.
// @field pivots        An array of Pivot objects. 
// @field sumVol        The volume sum for the pivot segment. 
// @field extend        Pivot object used to project a line from the last pivot to the last bar. 
export type ZigZag
    Settings settings
    array<Pivot> pivots
    float sumVol = 0
    Pivot extend = na

  
// @function            Finds a pivot point if the `src` has not been exceeded over the `length` of bars. Finds pivot highs when `isHigh` is true, and pivot lows otherwise.
// @param src           (series float) Data series to calculate the pivot value. 
// @param length        (series float) Length in bars required for pivot confirmation. 
// @param isHigh        (simple bool) Condition to determine if the Pivot is a pivot high or pivot low. 
// @returns             (Point) A Point object when a pivot is found, and `na` otherwise.
findPivotPoint(series float src, series float length, simple bool isHigh) =>
    float p = nz(src[length])
    if length == 0
        Point.new(time, p, bar_index)
    else if length * 2 <= bar_index
        bool isFound = true
        for i = 0 to math.abs(length - 1)
            if (isHigh and src[i] > p) or (not isHigh and src[i] < p)
                isFound := false
                break
        for i = length + 1 to 2 * length
            if (isHigh and src[i] >= p) or (not isHigh and src[i] <= p)
                isFound := false
                break
        if isFound
            Point.new(time[length], p, bar_index[length])


// @function            Calculates the absolute deviation percentage between the `price` and the `basePrice`. 
// @param basePrice     (series float) Start price. 
// @param price         (series float) End price. 
// @returns             (float) Absolute deviation percentage. 
calcDev(series float basePrice, series float price) =>
    float result = math.abs(100 * (price - basePrice) / basePrice)


// @function            Calculates the difference between the `start` and `end` point as a price or percentage difference and converts the value to a string variable. 
// @param start         (series float) Start price. 
// @param end           (series float) End price. 
// @param settings      (series Settings) A Settings object. 
// @returns             (string) A string representation of the difference between points. 
priceRotationDiff(series float start, series float end, Settings settings) =>
    float  diff    = end - start
    string sign    = math.sign(diff) > 0 ? "+" : ""
    string diffStr = settings.differencePriceMode == "Absolute" ? str.tostring(diff, format.mintick) : str.tostring(diff * 100 / start, format.percent)
    string result  = str.format("({0}{1})", sign, diffStr) 


// @function            Creates a string variable containing the price, cumulative volume, and change in price for the pivot.  
// @param start         (series float) Start price. 
// @param end           (series float) End price. 
// @param vol           (series float) Volume.
// @param settings      (series Settings) A Settings object.
// @returns             (string) A string to be displayed in pivot labels. 
priceRotationAggregate(series float start, series float end, series float vol, Settings settings) =>
    string str = ""
    if settings.displayReversalPrice
        str += str.tostring(end, format.mintick) + " "
    if settings.displayReversalPriceChange
        str += priceRotationDiff(start, end, settings) + " "
    if settings.displayCumulativeVolume
        str += "\n" + str.tostring(vol, format.volume)
    str


// @function            Produces a label at the `p` Point if `settings` display attributes are enabled. 
// @param isHigh        (series bool) Condition to determine the label color and location. 
// @param p             (series Point) A Point object. 
// @param settings      (series Settings) A Settings object. 
// @returns             (void) Function has no return. 
makePivotLabel(series bool isHigh, Point p, Settings settings) =>
    if settings.displayReversalPrice or settings.displayReversalPriceChange or settings.displayCumulativeVolume
        [yloc, txtColor] = switch 
            isHigh => [yloc.abovebar, color.green]
            =>        [yloc.belowbar, color.red]
        label.new(p.tm, p.price, style = label.style_none, xloc = xloc.bar_time, yloc = yloc, textcolor = txtColor)


// @function            Updates Pivot attributes including Point objects, volume, label text, and label and line object locations. 
// @param this          (series Pivot) Pivot object to be updated. 
// @param end           (series Point) Point to set the Pivot to. 
// @param vol           (series float) Volume of the Pivot.
// @param settings      (series Settings) A Settings object. 
// @returns             (void) Function has no return. 
updatePivot(Pivot this, Point end, float vol, Settings settings) =>
    this.end := end
    this.vol := vol
    if not na(this.lb)
        label.set_xy(this.lb, this.end.tm, this.end.price)
        label.set_text(this.lb, priceRotationAggregate(this.start.price, this.end.price, this.vol, settings))
    line.set_xy2(this.ln, this.end.tm, this.end.price)


// @function            Creates a new Pivot object and assigns a line and label if enabled in the `settings`. 
// @param start         (series Point) The start Point of the Pivot. 
// @param end           (series Point) The end Point of the Pivot. 
// @param vol           (series float) Volume of the Pivot. 
// @param isHigh        (series bool) Condition to determine if the Pivot is a pivot high or pivot low. 
// @param settings      (series settings) Settings object. 
// @returns             (Pivot) The new Pivot object. 
newPivot(series Point start, series Point end, series float vol, series bool isHigh, series Settings settings) =>
    Pivot p = Pivot.new(na, na, isHigh, vol, start, end)
    if settings.draw 
        p.ln := line.new(start.tm, start.price, end.tm, end.price, xloc = xloc.bar_time, color = settings.lineColor, width = 2)
        p.lb := makePivotLabel(isHigh, end, settings) 
    updatePivot(p, end, vol, settings)
    p


// @function            Deletes line and label objects from `this` Pivot. 
// @param this          (series Pivot) A Pivot object. 
// @returns             (void) Function has no return. 
delete(series Pivot this) =>
    if not na(this.ln)
        line.delete(this.ln)
        this.ln := na
    if not na(this.lb)
        label.delete(this.lb)
        this.lb := na


// @function            Determines if price of the `p` Point is greater than the end price of `this` Pivot. 
// @param this          (series Pivot) A Pivot object. 
// @param p             (series Point) A Point object. 
// @returns             (bool) true if the price of `p` is greater than `this` Pivot price. 
isMorePrice(series Pivot this, series Point p) => 
    int m = this.isHigh ? 1 : -1
    bool result = p.price * m > this.end.price * m


// @function            Returns the last Pivot of `this` ZigZag if there is at least one Pivot to return, and `na` otherwise. 
// @param this          (series ZigZag) A ZigZag object. 
// @returns             (Pivot) The last Pivot in the ZigZag. 
export lastPivot(series ZigZag this) =>
    int s = array.size(this.pivots)
    Pivot result = s > 0 ? array.get(this.pivots, s - 1) : na


// @function            Updates the last Pivot of `this` ZigZag to the `p` Point and sets the volume to 0. 
// @param this          (series ZigZag) A ZigZag object. 
// @param p             (series Point) The Point to set the Pivot to. 
// @returns             (void) Function has no return. 
updateLastPivot(series ZigZag this, series Point p) =>
    Pivot lastPivot = lastPivot(this)
    if array.size(this.pivots) == 1
        lastPivot.start := p
        if this.settings.draw
            line.set_xy1(lastPivot.ln, p.tm, p.price)
    updatePivot(lastPivot, p, lastPivot.vol + this.sumVol, this.settings)
    this.sumVol := 0


// @function            Pushes a `new` Pivot into the array within `this` ZigZag. 
// @param this          (series ZigZag) A ZigZag object.
// @param new           (series Pivot) The Pivot to add to the ZigZag. 
// @returns             (void) Function has no return. 
newPivotFound(series ZigZag this, series Pivot new) =>
    array.push(this.pivots, new)
    this.sumVol := 0


// @function            Determines if a new ZigZag line has been found or the existing line needs updating by comparing new pivots to the existing ZigZag Point. Updates `this` ZigZag and returns true if either condition occurs. 
// @param this          (series ZigZag) A ZigZag object.      
// @param isHigh        (series bool) Condition to look for pivot high or pivot low. 
// @param p             (Point) A Point object to compare to the current ZigZag Point. 
// @returns             (bool) true if a new ZigZag line is found or last zigzag line has changed. 
newPivotPointFound(series ZigZag this, simple bool isHigh, series Point p) =>
    bool result = false
    Pivot lastPivot = lastPivot(this)
    if not na(lastPivot)
        if lastPivot.isHigh == isHigh 
            if isMorePrice(lastPivot, p)
                updateLastPivot(this, p)
                result := true
        else 
            if calcDev(lastPivot.end.price, p.price) >= this.settings.devThreshold
                newPivotFound(this, newPivot(lastPivot.end, p, this.sumVol, isHigh, this.settings))
                result := true
    else
        newPivotFound(this, newPivot(p, p, this.sumVol, isHigh, this.settings))
        result := true
    result


// @function            Determines if a new ZigZag Point has been found. 
// @param this          (series ZigZag) a ZigZag object.   
// @param src           (series float) Data series to calculate the pivot. 
// @param isHigh        (simple bool) Condition to look for pivot high or pivot low. 
// @param depth         (series int) The length of bars to look for pivots. 
// @returns             (bool) true if a new Zig Zag line is found or the last Zig Zag line has changed. 
tryFindPivot(series ZigZag this, series float src, simple bool isHigh, series int depth) =>
    Point point = findPivotPoint(src, depth, isHigh)
    bool result = not na(point) ? newPivotPointFound(this, isHigh, point) : false


// @function            Updates `this` ZigZag object with new pivots, volume, lines, labels. NOTE: The function must be called on every bar for accurate calculations.   
// @param this          (series ZigZag) a ZigZag object.         
// @returns             (bool) true if a new Zig Zag line is found or the last Zig Zag line has changed. 
export update(series ZigZag this) =>
    int depth = math.floor(this.settings.depth / 2)
    this.sumVol += nz(volume[depth])
    bool somethingChanged = tryFindPivot(this, high, true, depth) or tryFindPivot(this, low, false, depth) 
    Pivot lastPivot = lastPivot(this)
    float remVol = math.sum(volume, math.max(depth, 1))
    if this.settings.extendLast and barstate.islast and not na(lastPivot)
        bool isHigh = not lastPivot.isHigh
        float curSeries = isHigh ? high : low
        Point end = Point.new(time, curSeries, bar_index)
        if na(this.extend) or somethingChanged
            if not na(this.extend)
                delete(this.extend)
            this.extend := newPivot(lastPivot.end, end, this.sumVol, isHigh, this.settings)
        updatePivot(this.extend, end, this.sumVol + remVol, this.settings)
    somethingChanged


// @function            Instantiates a new ZigZag object with `settings`. If no settings are provided, a default ZigZag object is created. 
// @param settings      (series Settings) A Settings object. 
// @returns             (ZigZag) A new ZigZag instance. 
export newInstance(series Settings settings = na) =>
    ZigZag result = ZigZag.new(na(settings) ? Settings.new() : settings, array.new<Pivot>())
//#endregion



//#region ———————————————————— Example Code

var Settings settings = 
 Settings.new(
 deviationInput, depthInput, 
 lineColorInput, extendInput, 
 showPriceInput, showVolInput, 
 showChgInput,   priceDiffInput)

var ZigZag zigZag = newInstance(settings)
update(zigZag)
//#endregion
