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

function createNestedSelectors(create, fns) {
  if (Array.isArray(fns)) {
    return fns.map(fn => Array.isArray(fn) ? create(fn) : fn)
  }

  return fns;
}

export const createSelectorCreator = (memoize, memoizeOptions) => {
  function createSelector(fns) {
    const initialRecomputations = Array(fns.length).fill(0);
    let recomputations = initialRecomputations;

    const selector = fns.reduceRight(function(next, currentFns, index) {
      currentFns = createNestedSelectors(createSelector, currentFns);

      const selectors = next
        ? makeDependenciesFn(currentFns, next)
        : currentFns;

      return memoize(function() {
        recomputations[index] += 1;
        return selectors.apply(null, arguments);
      }, memoizeOptions);
    }, null)

    selector.recomputations = () => recomputations;
    selector.resetRecomputations = () => recomputations = initialRecomputations;
    return selector;
  }
  return createSelector;
}

export const createSelector = createSelectorCreator(defaultMemoize);
