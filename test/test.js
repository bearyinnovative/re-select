const assert = require('assert');
import { defaultMemoize, createSelectorCreator, createSelectorsCreator, createSelector, createSelectors } from '../src/index.js';

describe('selector', () => {
  describe('basic usage', () => {
    const selector = createSelector(
      [
        state => state.a,
        a => a,
      ]
    )
    const state1 = { a: 1 };
    const state1New = { a: 1 };
    const state2 = { a: 2 };

    it('should return the correct result', () => {
      assert.equal(selector(state1), 1);
    })

    it('should avoid recomputations', () => {
      assert.equal(selector(state1), 1);
      assert.equal(selector.recomputations()[1], 1);
      assert.equal(selector(state1New), 1);
      assert.equal(selector.recomputations()[1], 1);
    })

    it('does recompute when arguments change', () => {
      assert.equal(selector(state2), 2);
      assert.equal(selector.recomputations()[1], 2);
    })
  })

  describe('multiple selectors', () => {
    const selector = createSelector(
      [
        [state => state.a, state => state.b],
        (a, b) => a + b,
        x => x * 2
      ]
    )

    const state1 = { a: 1, b: 3 };
    const state2 = { a: 3, b: 1 };

    it('should return the correct result', () => {
      assert.equal(selector(state1), 8)
    })

    it('should avoid recomputations', () => {
      assert.equal(selector(state1), 8);
      assert.equal(selector.recomputations()[1], 1);
      assert.equal(selector.recomputations()[2], 1);
      assert.equal(selector(state2), 8);
      assert.equal(selector.recomputations()[1], 2);
      assert.equal(selector.recomputations()[2], 1);
    })
  })

  describe('nested selector', () => {
    let nestedRecomputations = 0;

    const deepNested = [
      state => state.a,
      a => a + 1
    ]

    const nested = [
      [deepNested],
      a => {
        nestedRecomputations += 1;
        return a * 2
      }
    ]

    const selector = createSelector(
      [
        [nested, state => state.b],
        (a, b) => a + b
      ]
    )

    const state1 = { a: 2, b: 5 }
    const state2 = { a: 2, b: 1 }

    it('should return the corrent result', () => {
      assert.equal(selector(state1), 11);
    })

    it('should avoid recomputations in nested selectors', () => {
      assert.equal(nestedRecomputations, 1);
      assert.equal(selector.recomputations()[1], 1);
      assert.equal(selector(state2), 7);
      assert.equal(nestedRecomputations, 1);
      assert.equal(selector.recomputations()[1], 2);
    })
  })
})
