<p>
  <a href="https://aurelia.io/" target="_blank">
    <img alt="Aurelia" src="https://aurelia.io/styles/images/aurelia.svg">
  </a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm Version](https://img.shields.io/npm/v/aurelia-ui-virtualization.svg)](https://www.npmjs.com/package/aurelia-ui-virtualization)
![ci](https://github.com/aurelia/ui-virtualization/actions/workflows/main.yml/badge.svg)
[![Discourse status](https://img.shields.io/discourse/https/meta.discourse.org/status.svg)](https://discourse.aurelia.io)
[![Twitter](https://img.shields.io/twitter/follow/aureliaeffect.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=aureliaeffect)
[![Discord Chat](https://img.shields.io/discord/448698263508615178.svg)](https://discord.gg/RBtyM6u)

# aurelia-ui-virtualization

This library is part of the [Aurelia](http://www.aurelia.io/) platform and contains a plugin that provides a virtualized repeater and other virtualization services. This plugin enables "virtualization" of list through a new `virtual-repeat.for`. When used, the list "virtually" as tens or hundreds of thousands of rows, but the DOM only actually has rows for what is visible. It could be only tens of items. This allows rendering of massive lists of data with amazing performance. It works like repeat.for, it just creates a scrolling area and manages the list using UI virtualization techniques.

> To keep up to date on [Aurelia](http://www.aurelia.io/), please visit and subscribe to [the official blog](http://blog.aurelia.io/) and [our email list](http://eepurl.com/ces50j). We also invite you to [follow us on twitter](https://twitter.com/aureliaeffect). If you have questions look around our [Discourse forums](https://discourse.aurelia.io/), chat in our [community on Discord](https://discord.gg/RBtyM6u) or use [stack overflow](http://stackoverflow.com/search?q=aurelia). Documentation can be found [in our developer hub](http://aurelia.io/docs).

## Installation

Install via npm

```javascript
npm install aurelia-ui-virtualization
```

Load the plugin

```javascript
export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .developmentLogging()
    .plugin('aurelia-ui-virtualization'); // Add this line to load the plugin

  aurelia.start().then(a => a.setRoot());
}
```

## Use the plugin

Simply bind an array to `virtual-repeat` like you would with the standard `repeat`. The repeated rows need to have equal height throughout the list, and one items per row.

#### div
```html
<template>
  <div virtual-repeat.for="item of items">
    ${$index} ${item}
  </div>
</template>
```

#### unordered list
```html
<template>
  <ul>
    <li virtual-repeat.for="item of items">
    ${$index} ${item}
    </li>
  </ul>
</template>
```

#### table
```html
<template>
  <table>
    <tr virtual-repeat.for="item of items">
      <td>${$index}</td>
      <td>${item}</td>
    </tr>
  </table>
</template>
```

```javascript
export class MyVirtualList {
    items = ['Foo', 'Bar', 'Baz'];
}
```

With a surrounding fixed height container with overflow scroll. Note that `overflow: scroll` styling is inlined on the elemenet. It can also be applied from CSS.

```html
<template>
  <div style="overflow: scroll; height: 90vh">
    <div virtual-repeat.for="item of items">
      ${$index} ${item}
    </div>
  </div>
</template>
```

If you are running the plugin in the `skeleton-naviagion` project, make sure to remove `overflow-x: hidden;` and `overflow-y: auto;` from `.page-host` in `styles.css`.

#### infinite scroll
```html
<template>
  <div virtual-repeat.for="item of items" infinite-scroll-next="getMore">
    ${$index} ${item}
  </div>
</template>
```
```javascript
export class MyVirtualList {
  items = ['Foo', 'Bar', 'Baz'];
  getMore(topIndex, isAtBottom, isAtTop) {
    for(let i = 0; i < 100; ++i) {
      this.items.push('item' + i);
    }
  }
}
```

Or to use an expression, use `.call` as shown below.
```html
<template>
  <div virtual-repeat.for="item of items" infinite-scroll-next.call="getMore($scrollContext)">
    ${$index} ${item}
  </div>
</template>
```
```javascript
export class MyVirtualList {
  items = ['Foo', 'Bar', 'Baz'];
  getMore(scrollContext) {
    for(let i = 0; i < 100; ++i) {
      this.items.push('item' + i);
    }
  }
}
```

The `infinite-scroll-next` attribute can accept a function, a promise, or a function that returns a promise.
The bound function will be called when the scroll container has reached a point where there are no more items to move into the DOM (i.e. when it reaches the end of a list, either from the top or the bottom).

There are three parameters that are passed to the function (`getMore(topIndex, isAtBottom, isAtTop)`) which helps determine the behavior or amount of items to get during scrolling.
1. `topIndex` - A integer value that represents the current item that exists at the top of the rendered items in the DOM.
2. `isAtBottom` - A boolean value that indicates whether the list has been scrolled to the bottom of the items list.
3. `isAtTop` - A boolean value that indicates whether the list has been scrolled to the top of the items list.


## Caveats

  1. `<template/>` is not supported as root element of a virtual repeat template. This is due to the requirement of aurelia ui virtualization technique: item height needs to be calculatable. With `<tempate/>`, there is no easy and performant way to acquire this value.
  2. Similar to (1), other template controllers cannot be used in conjunction with `virtual-repeat`, unlike `repeat`. I.e: built-in template controllers: `with`, `if`, `replaceable` cannot be used with `virtual-repeat`. This can be workaround'd by nesting other template controllers inside the repeated element, with `<template/>` element, for example:

  ```html
  <template>
    <h1>${message}</h1>
    <div virtual-repeat.for="person of persons">
      <template with.bind="person">
        ${Name}
      </template>
    </div>
  </template>
  ```
  3. Beware of CSS selector `:nth-child` and similar selectors. Virtualization requires appropriate removing and inserting visible items, based on scroll position. This means DOM elements order will not stay the same, thus creating unexpected `:nth-child` CSS selector behavior. To work around this, you can use contextual properties `$index`, `$odd`, `$even` etc... to determine an item position, and apply CSS classes/styles against it, like the following example:

  ```html
  <template>
    <div virtual-repeat.for="person of persons" class="${$odd ? 'odd' : 'even'}-row">
      ${person.name}
    </div>
  </template>
  ```
  4. Similar to (3), virtualization requires appropriate removing and inserting visible items, so not all views will have their lifecycle invoked repeatedly. Rather, their binding contexts will be updated accordingly when the virtual repeat reuses the view and view model. To work around this, you can have your components work in a reactive way, which is natural in an Aurelia application. An example is to handle changes in change handler callback.

## [Demo](https://aurelia-ui-virtualization.now.sh/)

## [Online Playground](https://codesandbox.io/s/m781l8oyqj)

## Platform Support

This library can be used in the **browser** only.

## Building The Code

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. To build the code, you can now run:

  ```shell
  npm run build
  ```
4. You will find the compiled code in the `dist` folder, available in module formats: es2015, es2017, AMD, CommonJS and UMD.

## Running The Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. Run the tests with this command:

  ```shell
  npm run test
  ```
