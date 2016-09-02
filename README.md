# aurelia-ui-virtualization

[![npm Version](https://img.shields.io/npm/v/aurelia-ui-virtualization.svg)](https://www.npmjs.com/package/aurelia-ui-virtualization)
[![ZenHub](https://raw.githubusercontent.com/ZenHubIO/support/master/zenhub-badge.png)](https://zenhub.io)
[![Join the chat at https://gitter.im/aurelia/discuss](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/aurelia/discuss?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![CircleCI](https://circleci.com/gh/aurelia/ui-virtualization.svg?style=shield)](https://circleci.com/gh/aurelia/ui-virtualization)

This library is part of the [Aurelia](http://www.aurelia.io/) platform and contains a plugin that provides a virtualized repeater and other virtualization services. This plugin enables "virtualization" of list through a new `virtual-repeat.for`. When used, the list "virtually" as tens or hundreds of thousands of rows, but the DOM only actually has rows for what is visible. It could be only tens of items. This allows rendering of massive lists of data with amazing performance. It works like repeat.for, it just creates a scrolling area and manages the list using UI virtualization techniques.

> To keep up to date on [Aurelia](http://www.aurelia.io/), please visit and subscribe to [the official blog](http://blog.durandal.io/) and [our email list](http://durandal.us10.list-manage1.com/subscribe?u=dae7661a3872ee02b519f6f29&id=3de6801ccc). We also invite you to [follow us on twitter](https://twitter.com/aureliaeffect). If you have questions, please [join our community on Gitter](https://gitter.im/aurelia/discuss). If you would like to have deeper insight into our development process, please install the [ZenHub](https://zenhub.io) Chrome or Firefox Extension and visit any of our repository's boards. You can get an overview of all Aurelia work by visiting [the framework board](https://github.com/aurelia/framework#boards).

## Installation

Install via JSPM

```javascript
jspm install aurelia-ui-virtualization
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

With a surrounding fixed height container with overflow scroll. Note that `overflow: scroll` styling needs to be inline on the elemenet.

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


## [Demo](http://aurelia.io/ui-virtualization/)

## Platform Support

This library can be used in the **browser** only.

## Building The Code

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. Ensure that [Gulp](http://gulpjs.com/) is installed. If you need to install it, use the following command:

  ```shell
  npm install -g gulp
  ```
4. To build the code, you can now run:

  ```shell
  gulp build
  ```
5. You will find the compiled code in the `dist` folder, available in three module formats: AMD, CommonJS and ES6.

6. See `gulpfile.js` for other tasks related to generating the docs and linting.

## Running The Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. Ensure that the [Karma](http://karma-runner.github.io/) CLI is installed. If you need to install it, use the following command:

  ```shell
  npm install -g karma-cli
  ```
2. Ensure that [jspm](http://jspm.io/) is installed. If you need to install it, use the following commnand:

  ```shell
  npm install -g jspm
  ```
3. Install the client-side dependencies with jspm:

  ```shell
  jspm install
  ```

4. You can now run the tests with this command:

  ```shell
  karma start
  ```
