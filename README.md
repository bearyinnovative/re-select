# re-select
Memoized selector library

[![Travis branch](https://img.shields.io/travis/bearyinnovative/re-select/master.svg?style=flat-square)](https://travis-ci.org/bearyinnovative/re-select)
[![npm](https://img.shields.io/npm/v/re-select.svg?style=flat-square)](https://www.npmjs.com/package/re-select)

The motivation behind this library is to improve [reselect](https://github.com/reactjs/reselect) usage to be more resilient and concise. By using the new way to construct selectors, you should be able to write selectors that are easier to combine with.

```JavaScript
/* selectors.js
**
** You never call createSelector in your `selectors.js`
** import { createSelector } from 'reselect'
*/

const shopItemsSelector = state => state.shop.items
const taxPercentSelector = state => state.shop.taxPercent

// Notice how to use an array structure to describe a selector
const subtotalSelector = [
  shopItemsSelector,
  items => items.reduce((acc, item) => acc + item.value, 0)
]

const taxSelector = [
  [subtotalSelector, taxPercentSelector],
  (subtotal, taxPercent) => subtotal * (taxPercent / 100)
]

let exampleState = {
  shop: {
    taxPercent: 8,
    items: [
      { name: 'apple', value: 1.20 },
      { name: 'orange', value: 0.95 },
    ]
  }
}

// container.js
// On your view layer where the selectors actually get called
import createSelector from 're-select';

connect(createSelector({
  subtotal: subtotalSelector, // 2.15
  tax:      taxSelector,      // 0.172
}))
``` 

## Installation

```
npm install re-select
```

## Examples

This introduction will assume you have a basic understanding of [reselect](https://github.com/reactjs/reselect#example). The major difference between re-select and reselect is how you describe/combine a selector.

```JavaScript
const getVisibilityFilter = (state) => state.visibilityFilter
const getTodos = (state) => state.todos

/*
const getVisibleTodosFilteredByKeyword = createSelector(
  [ getVisibleTodos, getKeyword ],
  (visibleTodos, keyword) => visibleTodos.filter(
    todo => todo.text.includes(keyword)
  )
)
*/

const filteredVisibleTodosSelector = [
  [ getVisibleTodos, getKeyword ],
  (visibleTodos, keyword) => visibleTodos.filter(
    todo => todo.text.includes(keyword)
  )
]
```
A very common selector shown in the example above. Instead of calling `createSelector` to create a selector function, you construct an array structure to describe a selector.

Let's take a closer look on how it works.

The selectors consisted of two parts.
The first element is an array of functions, each of which takes the store as input. The second element is a plain function, it takes the value of selectors in the first element as input. So the first argument it takes will be the result of `getVisibleTodos` and the second will be `getKeyword`. The Values of each element are cached so if the values of one element are the same as previous the following element will not get called and return the previously computed value. In this example, the second element function will not run until the result of `getVisibleTodos` or `getKeyword` changed.

### Nested Selector

On the previous example, all input selectors are functions.
But they don't have to be.

```JavaScript
const todoAuthorSelector = [
  [filteredVisibleTodosSelector],
  todos => todos.map(todo => todo.author)
]
```

A valid selector description can be a function, an array or a plain object(we'll see it later).

### Multiple Pipeline Selector

Let's implement the `todoAuthorSelector` without nested selectors this time.

```JavaScript
const todoAuthorSelector = [
  [ getVisibleTodos, getKeyword ],
  (visibleTodos, keyword) => visibleTodos.filter(
    todo => todo.text.includes(keyword)
  ),
  todos => todos.map(todo => todo.author)
]
```

You can have even more element in a selector.
Like what we have known, each element is memorized and each element takes the previous as input.
You should also notice the second element have not been wrapped in `[]`. It's fine, `[]` is optional when there is only one selector that is **not an array**.

### Structured Selector

When working on a react/redux project, it's a common pattern that selecting data from the redux store and passing it as props to a component. A selector might look like this:

```JavaScript
const usernameSelector = state => state.user.name
const postsSelector = state => state.posts

connect(createSelector([
  [usernameSelector, postsSelector],
  (username, posts) => ({
    username,
    posts,
  })
]))
```

It is when structured selectors come into play.
Structured selectors are objects whose properties are a selector. A structured selector equivalent to above can be:

```JavaScript
connect(createSelector({
  username: usernameSelector,
  posts: postsSelector,
}))
```

## API

### createSelector: selector => memoizedFunction

Takes one selector, return a memoized function.
A selector can be a function, an array or a plain object. It determines if the value has changed using reference equality(`===`).

### createMemoizor: equalityCheck => function => memoizedFunction

Passing in an `equalityCheck` function, return a function that transforms a function to the memoized version.

### createSelectorCreator: memoize => createSelector
`createSelectorCreator` takes a `memoize` function as input and returns a customized version of `createSelector`.

Here is an example for using [`Immutable.is`](https://facebook.github.io/immutable-js/docs/#/is) as `equalityCheck`

```JavaScript
import { is } from 'immutable'
import { createSelectorCreator, createMemoizor } from 're-select'

const createImmutableSelector = createSelectorCreator(createMemoizor(is))
```

## License
MIT
