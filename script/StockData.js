export class Stock {
    constructor(data) {
        this.data = data;
    }
}

export class Symbol {
    constructor(symbol, high, low, close, basic, vol) {
        this.symbol = symbol;
        this.high = high;
        this.low = low;
        this.close = close;
        this.basic = basic;
        this.vol = vol;
        return this;
    }
}

export class Indicator {

}