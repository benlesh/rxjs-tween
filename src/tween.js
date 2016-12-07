function tween(duration = 500,
  easingFn = linear,
  scheduler = Rx.Scheduler.animationFrame) {
  return this.lift(new TweenOperator(duration, easingFn, scheduler));
};

function TweenOperator(duration, easingFn, scheduler) {
  this.duration = duration;
  this.easingFn = easingFn;
  this.scheduler = scheduler;
}

TweenOperator.prototype.call = function tweenCall(destination, source) {
  return source._subscribe({
    destination: destination,
    next: function (curr) {
      const { prev, innerSub } = this;
      this.start = Date.now();
      this.prev = this.curr;
      this.curr = curr;
      if (innerSub) innerSub.unsubscribe();
      this.innerSub = this.scheduler.schedule(
        this._dispatchTween,
        0,
        this
      );
    },
    error: function (err) { this.destination.error(err); },
    complete: function () { this.destination.complete(); },
    duration: this.duration,
    easingFn: this.easingFn,
    scheduler: this.scheduler,
    innerSub: undefined,
    prev: undefined,
    start: undefined,
    _dispatchTween: function (state) {
      // `this` is the action
      const { start, curr, easingFn, duration, destination } = state;
      let { prev } = state;
      const d = Date.now() - start;
      prev = prev || 0;
      if (d < duration) {
        destination.next(prev + ((curr - prev) * easingFn(d / duration)));
        state.innerSub = this.schedule(state, 0);
      }
    }
  });
};

Observable.prototype.tween = tween;
