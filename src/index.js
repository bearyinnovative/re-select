const defaultEqualityCheck = (a, b) => a === b;

function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
  if (prev === null || next === null || prev.length !== next.length) {
    return false;
  }

  for (let i = prev.length - 1; i >= 0; --i) {
    if (!equalityCheck(prev[i], next[i])) {
      return false;
    }
  }

  return true
}

export function defaultMemoize(fn, equalityCheck = defaultEqualityCheck) {
  let lastArgs = null;
  let lastResult = null;
  return function() {
    if (!areArgumentsShallowlyEqual(equalityCheck, lastArgs, arguments)) {
      lastResult = fn.apply(null, arguments);
    }
    lastArgs = arguments
    return lastResult;
  }
}

export const createSelectorCreator = (memoize, memoizeOptions) => fns => {
  let recomputations = 0;
  const resultFn = fns[fns.length - 1];
  const dependencies = fns.slice(0, -1);

  const memoizedResultFn = memoize(
    function() {
      recomputations += 1;
      return resultFn.apply(null, arguments);
    }
  )

  const selector = dependencies.reduceRight(function(next, currentFns, index) {
    currentFns = Array.isArray(currentFns) ? currentFns : [currentFns];
    return memoize(function() {
      const params = currentFns.map(fn => fn.apply(null, arguments));
      return next.apply(null, params);
    }, memoizeOptions);
  }, memoizedResultFn)

  selector.resultFn = resultFn;
  selector.recomputations = () => recomputations;
  selector.resetRecomputations = () => recomputations = 0;
  return selector;
}

export const createSelectorsCreator = createSelector => selectors => {
  if (Array.isArray(selectors)) {
    return createSelector(selectors);
  }

  const keys = Object.keys(selectors);
  const memoizedSelectors = {};
  for (let i = keys.length - 1; i >= 0; --i) {
    const key = keys[i];
    memoizedSelectors[key] = createSelector(selectors[key])
  }
  return memoizedSelectors;
}

export const createSelector = createSelectorCreator(defaultMemoize);
export const createSelectors = createSelectorsCreator(createSelector);
