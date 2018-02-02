const identity = a => a;

const defaultEqualityCheck = (a, b) => a === b;

function areArgumentsEqual(equalityCheck, a, b) {
  if (a === null || b === null || a.length !== b.length) {
    return false;
  }

  for (let i = a.length - 1; i >= 0; --i) {
    if (!equalityCheck(a[i], b[i])) {
      return false;
    }
  }

  return true;
}

export const createMemoizor = (equalityCheck = defaultEqualityCheck) => fn => {
  let lastArgs = null;
  let lastResult = null;
  return function() {
    if (!areArgumentsEqual(equalityCheck, lastArgs, arguments)) {
      lastResult = fn.apply(null, arguments);
    }
    lastArgs = arguments;
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

export const createSelectorCreator = memoize => {
  function createSelector(fns) {
    const selector = fns.reduceRight(function(next, currentFns, index) {
      currentFns = createNestedSelectors(createSelector, currentFns);
      const dependenciesFn = makeDependenciesFn(currentFns, next)
      return memoize(dependenciesFn);
    }, identity)

    return selector;
  }
  return createSelector;
}

export const createSelector = createSelectorCreator(createMemoizor());
