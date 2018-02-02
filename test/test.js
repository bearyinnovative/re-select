import { createSelector, createSelectorCreator, createMemoizor } from '../src/index.js';
const assert = require('assert');

const createCountSelector = fn => {
  let recomputations = 0;
  function selector() {
    recomputations += 1;
    return fn.apply(null, arguments);
  }

  selector.getRecomputations = () => recomputations;

  selector.resetRecomputations = () => {
    recomputations = 0;
  }

  return selector;
}

describe('basic usage', () => {
  const subSelector = createCountSelector(a => a);
  const state1 = { a: 1 };
  const state1New = { a: 1 };
  const state2 = { a: 2 };

  let selector;
  beforeEach(function() {
    selector = createSelector(
      [
        state => state.a,
        subSelector
      ]
    )
    subSelector.resetRecomputations();
  })

  it('should return the correct result', () => {
    assert.equal(selector(state1), 1);
    assert.equal(selector(state2), 2);
  })

  it('should avoid recomputations', () => {
    assert.equal(selector(state1), 1);
    assert.equal(subSelector.getRecomputations(), 1);
    assert.equal(selector(state1New), 1);
    assert.equal(subSelector.getRecomputations(), 1);
  })

  it('does recompute when arguments change', () => {
    assert.equal(selector(state1), 1);
    assert.equal(subSelector.getRecomputations(), 1);
    assert.equal(selector(state2), 2);
    assert.equal(subSelector.getRecomputations(), 2);
  })
})

describe('multiple selectors', () => {
  const subSelector1 = createCountSelector((a, b) => a + b);
  const subSelector2 = createCountSelector(a => a * 2);
  const state1 = { a: 1, b: 3 };
  const state2 = { a: 3, b: 1 };

  let selector;
  beforeEach(function() {
    selector = createSelector(
      [
        [state => state.a, state => state.b],
        subSelector1,
        subSelector2
      ]
    )
    subSelector1.resetRecomputations();
    subSelector2.resetRecomputations();
  })

  it('should return the correct result', () => {
    assert.equal(selector(state1), 8)
  })

  it('should avoid recomputations', () => {
    assert.equal(selector(state1), 8);
    assert.equal(subSelector1.getRecomputations(), 1);
    assert.equal(subSelector2.getRecomputations(), 1);
    assert.equal(selector(state2), 8);
    assert.equal(subSelector1.getRecomputations(), 2);
    assert.equal(subSelector2.getRecomputations(), 1);
  })
})

describe('nested selector', () => {
  const deepNested = [
    state => state.a,
    a => a + 1
  ]

  const nestedSubSelector = createCountSelector(a => a * 2);
  const nested = [
    [deepNested],
    nestedSubSelector
  ]

  const subSelector = createCountSelector((a, b) => a + b);

  const state1 = { a: 2, b: 5 }
  const state2 = { a: 2, b: 1 }

  let selector;
  beforeEach(function() {
    selector = createSelector(
      [
        [nested, state => state.b],
        subSelector
      ]
    )
    nestedSubSelector.resetRecomputations();
    subSelector.resetRecomputations();
  })

  it('should return the correct result', () => {
    assert.equal(selector(state1), 11);
  })

  it('should avoid recomputations in nested selectors', () => {
    assert.equal(selector(state1), 11);
    assert.equal(nestedSubSelector.getRecomputations(), 1);
    assert.equal(subSelector.getRecomputations(), 1);
    assert.equal(selector(state2), 7);
    assert.equal(nestedSubSelector.getRecomputations(), 1);
    assert.equal(subSelector.getRecomputations(), 2);
  })
})

describe('custom equals selector', () => {
  const deepEqual = function(a, b) {
    if (
      ( typeof a == 'object' && a != null ) &&
      ( typeof b == 'object' && b != null )
    ) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      for (let key of keysA) {
        if (!b.hasOwnProperty(key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
      }

      return true;
    } else
      return a === b;
  }
  const createDeepEqualSelector = createSelectorCreator(createMemoizor(deepEqual));

  const subSelector = createCountSelector(a => a.b);
  const state1 = { a: { b: 1 } };
  const state2 = { a: { b: 1 } };

  let selector;
  beforeEach(function() {
    selector = createDeepEqualSelector(
      [
        state => state.a,
        subSelector
      ]
    )
    subSelector.resetRecomputations();
  })

  it('should return the correct result', () => {
    assert.equal(selector(state1), 1);
  })

  it('should avoid recomputations', () => {
    assert.equal(selector(state1), 1);
    assert.equal(subSelector.getRecomputations(), 1);
    assert.equal(selector(state2), 1);
    assert.equal(subSelector.getRecomputations(), 1);
  })
})
