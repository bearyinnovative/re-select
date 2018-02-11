const isObject = a => typeof a == 'object' && a !== null;

const isArray = a => Array.isArray(a);

const isFunction = a => typeof a === 'function';

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

function createNestedSelectors(selectors, next) {
  return selectors.map(fn => isFunction(fn) ? fn : next(fn))
}

function normalizeSelector(selector) {
  if (isArray(selector)) {
    return selector.map(
      nestedSelector => (
        isArray(nestedSelector) ? nestedSelector : [nestedSelector]
      ).map(normalizeSelector)
    )
  }

  if (isObject(selector)) {
    const objectKeys = Object.keys(selector);
    return [
      objectKeys.map(key => normalizeSelector(selector[key])),
      (...values) => values.reduce(
        (composition, value, index) => Object.assign(composition, {
          [objectKeys[index]]: value
        }),
        {}
      )
    ]
  }

  if (isFunction(selector)) {
    return selector;
  }

  throw new Error(
    `Invalid value of type ${typeof selector} for creating a selector`
  );
}

export const createSelectorCreator = memoize => {
  function createSelector(selector) {
    const selectorNormalized = normalizeSelector(
      isFunction(selector) ? [selector, identity] : selector
    )

    return selectorNormalized.reduceRight(function(next, cur, index) {
      const dependenciesFn = makeDependenciesFn(
        createNestedSelectors(cur, createSelector),
        next
      );
      return memoize(dependenciesFn);
    }, identity);
  }

  return createSelector;
}

export const createSelector = createSelectorCreator(createMemoizor());
export default createSelector;
