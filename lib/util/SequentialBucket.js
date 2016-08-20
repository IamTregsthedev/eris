"use strict";

/**
* Ratelimit requests and release in sequence
* @prop {Number} limit How many tokens the bucket can consume in the current interval
* @prop {Number} remaining How many tokens the bucket has left in the current interval
* @prop {Number} reset Timestamp of next reset
* @prop {Boolean} processing Timestamp of last token consumption
*/
class SequentialBucket {
    /**
    * Construct a SequentialBucket
    * @arg {Number} tokenLimit The max number of tokens the bucket can consume per interval
    * @returns {SequentialBucket} A SequentialBucket object
    */
    constructor(limit) {
        this.limit = this.remaining = limit;
        this.resetInterval = 0;
        this.reset = 0;
        this.processing = false;
        this._queue = [];
    }

    /**
    * Queue something in the SequentialBucket
    * @arg {Function} func A function to call when a token can be consumed. The function will be passed a callback argument, which must be called to allow the bucket to continue to work
    */
    queue(func) {
        this._queue.push(func);
        this.check();
    }

    check(override) { // Overcomplicated unoptimized math things
        if((this.processing && !override) || this._queue.length === 0) {
            return;
        }
        this.processing = true;
        if(this.reset && this.reset < Date.now()) {
            this.reset = this.resetInterval ? Date.now() + this.resetInterval : 0;
            this.remaining = this.limit;
        }
        if(this.last >= Date.now() - 3) {
            throw new Error("loop")
        }
        this.last = Date.now();
        if(this.remaining <= 0) {
            return setTimeout(() => {
                this.check(true);
            }, this.reset ? Math.max(200, this.reset - Date.now()) : 200);
        }
        --this.remaining;
        this._queue.shift()(() => {
            if(this._queue.length > 0) {
                this.check(true);
            } else {
                this.processing = false;
            }
        });
    }
}

module.exports = SequentialBucket;