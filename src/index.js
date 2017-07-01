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

function makeDependenciesFn(fns, next) {
  fns = Array.isArray(fns) ? fns : [fns];
  return function() {
    const params = fns.map(fn => fn.apply(null, arguments));
    return next.apply(null, params);
  }
}

export const createSelectorCreator = (memoize, memoizeOptions) => fns => {
  const initialRecomputations = Array(fns.length).fill(0);
  let recomputations = initialRecomputations;

  const selector = fns.reduceRight(function(next, currentFns, index) {
    const selectors = next ? makeDependenciesFn(currentFns, next) : currentFns;
    return memoize(function() {
      recomputations[index] += 1;
      return selectors.apply(null, arguments);
    }, memoizeOptions);
  }, null)

  selector.recomputations = () => recomputations;
  selector.resetRecomputations = () => recomputations = initialRecomputations;
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
