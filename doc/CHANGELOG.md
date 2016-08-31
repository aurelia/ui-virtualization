<a name="1.0.0-beta.3.0.1"></a>
# [1.0.0-beta.3.0.1](https://github.com/aurelia/ui-virtualization/compare/1.0.0-beta.3.0.0...v1.0.0-beta.3.0.1) (2016-08-31)


### Bug Fixes

* **virtual-repeat:** check for infinite-scroll attribute ([c779738](https://github.com/aurelia/ui-virtualization/commit/c779738))



<a name="1.0.0-beta.3.0.0"></a>
# [1.0.0-beta.3.0.0](https://github.com/aurelia/ui-virtualization/compare/1.0.0-beta.2.0.0...v1.0.0-beta.3.0.0) (2016-08-26)


### Bug Fixes

* **package.json:** change package.json to properly define resources ([4da877f](https://github.com/aurelia/ui-virtualization/commit/4da877f))
* **virtual-repeat:** make infinite scroll work with initial small page size ([cb135a2](https://github.com/aurelia/ui-virtualization/commit/cb135a2))
* **virtual-repeat:** make initially hidden elements display correctly ([319cc59](https://github.com/aurelia/ui-virtualization/commit/319cc59))


### Code Refactoring

* **all:** rename `virtual-repeat-next` to `infinite-scroll-next` ([b7ff555](https://github.com/aurelia/ui-virtualization/commit/b7ff555))


### Features

* **virtual-repeat:** allow use of `.call` on `virtual-repeat-next` ([2d1789b](https://github.com/aurelia/ui-virtualization/commit/2d1789b))


### BREAKING CHANGES

* all: Renamed `virtual-repeat-next` to
`infinite-scroll-next` to provide more meaning to the attribute.



<a name="1.0.0-beta.2.0.0"></a>
# [1.0.0-beta.2.0.0](https://github.com/aurelia/ui-virtualization/compare/1.0.0-beta.1.0.2...v1.0.0-beta.2.0.0) (2016-07-27)



<a name="1.0.0-beta.1.0.2"></a>
# [1.0.0-beta.1.0.2](https://github.com/aurelia/ui-virtualization/compare/1.0.0-beta.1.0.1...v1.0.0-beta.1.0.2) (2016-07-12)


### Bug Fixes

* **dist:** restore release dist folder ([45f74be](https://github.com/aurelia/ui-virtualization/commit/45f74be))
* **table-strategy:** move buffer elements outside of table ([1fe64a6](https://github.com/aurelia/ui-virtualization/commit/1fe64a6)), closes [#46](https://github.com/aurelia/ui-virtualization/issues/46)


### Features

* **all:** support infinite scroll ([9a3b965](https://github.com/aurelia/ui-virtualization/commit/9a3b965))
* **virtual-repeat:** pass location state to scroll callback ([29418bf](https://github.com/aurelia/ui-virtualization/commit/29418bf))



<a name="1.0.0-beta.1.0.1"></a>
# [1.0.0-beta.1.0.1](https://github.com/aurelia/ui-virtualization/compare/1.0.0-beta.1.0.0...v1.0.0-beta.1.0.1) (2016-07-06)


### Bug Fixes

* **template-strategy:** move views correctly ([5b5e6e6](https://github.com/aurelia/ui-virtualization/commit/5b5e6e6)), closes [#68](https://github.com/aurelia/ui-virtualization/issues/68)



<a name="1.0.0-beta.1.0.0"></a>
# [1.0.0-beta.1.0.0](https://github.com/aurelia/ui-virtualization/compare/0.5.2...v1.0.0-beta.1.0.0) (2016-06-22)



### 0.4.6 (2016-05-31)


### 0.4.5 (2016-05-10)


#### Bug Fixes

* **all:** import from root of dependencies ([6c41804f](http://github.com/aurelia/ui-virtualization/commit/6c41804f54e7951115f433b13fc2ab79ad20ae15), closes [#48](http://github.com/aurelia/ui-virtualization/issues/48))
* **array-virtual-repeat-strategy:** error when deleting a lot of items ([b35135db](http://github.com/aurelia/ui-virtualization/commit/b35135dba7bd473a88383cbfc52e44e41000211b), closes [#49](http://github.com/aurelia/ui-virtualization/issues/49))


### 0.4.4 (2016-04-28)


#### Bug Fixes

* **utilities:** undefined parentElement in IE11 ([c7bb7857](http://github.com/aurelia/ui-virtualization/commit/c7bb78576cf584c203cddb2e9374ff9df4284caf))


### 0.4.3 (2016-04-21)


#### Bug Fixes

* **virtual-repeat:**
  * continuously calc distance to top of document ([4b8649e7](http://github.com/aurelia/ui-virtualization/commit/4b8649e7416517ad217addf20bef6e26e2366e69))
  * handle mutations with value converters ([9aac0c77](http://github.com/aurelia/ui-virtualization/commit/9aac0c772fb128bd5cd4679cbfcbfccb7ebef380))
  * table rendering not working ([13db6df7](http://github.com/aurelia/ui-virtualization/commit/13db6df782decce19fdf59b757cd036fc60a099b), closes [#44](http://github.com/aurelia/ui-virtualization/issues/44))


### 0.4.2 (2016-04-13)

* refactoring, styling and cleanup

### 0.4.1 (2016-04-07)


#### Bug Fixes

* **array-virtual-repeat-strategy:** handle instance changes with less items than in view slot ([4eb9ca00](http://github.com/aurelia/ui-virtualization/commit/4eb9ca00587739ecb9446d82d779913303a146c9), closes [#41](http://github.com/aurelia/ui-virtualization/issues/41))
* **virtual-repeat:** calculate the list's distance to top ([7e9c0352](http://github.com/aurelia/ui-virtualization/commit/7e9c035255abc287a516624f0e4bb5b3901b7f5e))


## 0.4.0 (2016-03-29)


#### Bug Fixes

* **array-virtual-repeat-strategy:**
  * add new items to the distance to bottom view port ([60383100](http://github.com/aurelia/ui-virtualization/commit/603831008f43fb1fb67a538b9191483c3a1259fc))
  * queue changes when animating ([c4fff68b](http://github.com/aurelia/ui-virtualization/commit/c4fff68b6403eca9a3802653f77d250ce749a1ab))
  * do not remove views when less than max rendered ([312f4caf](http://github.com/aurelia/ui-virtualization/commit/312f4caf2dac668225404e8d5dfa7602ffb87762))
  * handel added items when scrolled to bottom ([ed3b014c](http://github.com/aurelia/ui-virtualization/commit/ed3b014c63bcafc4df5f52ea72b4426c5f057260))
  * handle remove from bottom and top ([46c8ba71](http://github.com/aurelia/ui-virtualization/commit/46c8ba711c0455a5ba461fe2134f1f14c7af4c9d))
* **utilities:** rename updateOverrideContexts to updateVirtualOverrideContexts ([c879a08f](http://github.com/aurelia/ui-virtualization/commit/c879a08f6f6b693fe0e4e0ba74302199c64cd6ef))
* **view-strategy:**
  * keep anchor node at bottom ([7857725f](http://github.com/aurelia/ui-virtualization/commit/7857725f9293b05a3a3672d6ca4902a0f050218f))
  * handle detached ([4f10fcc5](http://github.com/aurelia/ui-virtualization/commit/4f10fcc5ed3a62cd6ea2b9a72327117c111221cc))
* **virtual-repeat:**
  * initialize scroll at top to true ([7264d3d6](http://github.com/aurelia/ui-virtualization/commit/7264d3d6930293dc5bb869dd47ff464f070a333f))
  * stop updating when scrolling passed the list ([b7c19e6f](http://github.com/aurelia/ui-virtualization/commit/b7c19e6f111e4fa594d2f37d7b999039dd272a8b))
  * move views at top and bottom when virtualised ([7775796e](http://github.com/aurelia/ui-virtualization/commit/7775796eb2586bf27c3ed08ac8e5a420db97c6e0))
  * remove resize handling ([029e6efb](http://github.com/aurelia/ui-virtualization/commit/029e6efb21910c79a28ae6fe3c3968a39968da42))
  * support fixed height container ([80704074](http://github.com/aurelia/ui-virtualization/commit/807040741d900e503ed205c7f2cd971110b42aeb))
  * do not move view when at top or bottom ([dce3107a](http://github.com/aurelia/ui-virtualization/commit/dce3107a519c3d65a768b4c4221b8fa80f25b651))
  * handle bind with less items than whats fits in view port ([9e6f121a](http://github.com/aurelia/ui-virtualization/commit/9e6f121a26c5995ea4aa5ac262274e006db17683), closes [#39](http://github.com/aurelia/ui-virtualization/issues/39))
  * remove scrollList ([05ecd2ff](http://github.com/aurelia/ui-virtualization/commit/05ecd2ff8371c46e448af12ef9c3a5bb2cd73029))
  * handle remove items from list ([498296b1](http://github.com/aurelia/ui-virtualization/commit/498296b1b785cbbaa0476ec0c6e932daaa00643f))


#### Features

* **TableStrategy:** remove need for surrounding container ([617d7570](http://github.com/aurelia/ui-virtualization/commit/617d7570627ae4b3ff63049a09237446f0623d52))
* **virtual-list:** remove VirtualList ([d52201c2](http://github.com/aurelia/ui-virtualization/commit/d52201c2cee28c25728fb1e00a9f6f90f9f8fc61))
* **virtual-repeat:**
  * support multiple virtual-repeat after each other ([5e99c07e](http://github.com/aurelia/ui-virtualization/commit/5e99c07e3a3a382f787d90eef27c0e39750e330a))
  * no need for surrounding container ([37c68bbd](http://github.com/aurelia/ui-virtualization/commit/37c68bbd2c5fc1b141aa97a16e40f94fcc95368e))
  * support inline virtualization ([4805482c](http://github.com/aurelia/ui-virtualization/commit/4805482ce46199abfef694a935e3f5e092dfcc80))


### 0.3.2 (2016-03-01)


#### Bug Fixes

* **ScrollHandler:** make ScrollHandler transient ([afd6436b](http://github.com/aurelia/ui-virtualization/commit/afd6436ba02ebde9e4ccafda8f9759488895609a), closes [#15](http://github.com/aurelia/ui-virtualization/issues/15))
* **all:** remove core-js and fix package for jspm ([4cec9f13](http://github.com/aurelia/ui-virtualization/commit/4cec9f13987eb03c032bc74b5861223d803dd07c))
* **array-virtual-repeat-array-strategy:** support iterating custom elements ([6381eb27](http://github.com/aurelia/ui-virtualization/commit/6381eb271249817d22fcf546fb0e54ad50d5a9de))
* **array-virtual-repeat-strategy:**
  * get first index by looking at view index ([bd52bc9d](http://github.com/aurelia/ui-virtualization/commit/bd52bc9ddccf3c5308942c7893b437d20916731e))
  * update to work with latest templating-resources ([0b442c11](http://github.com/aurelia/ui-virtualization/commit/0b442c1180a71119dfdf572e5a4063596b6bb338))
* **virtual-repeat:**
  * correctly remove EventListener ([fd39c211](http://github.com/aurelia/ui-virtualization/commit/fd39c2115549c3fce3c9ff4d4e91e3e6d4bd5f0c))
  * blank rows when swapping arrays with different lengths ([2eadedef](http://github.com/aurelia/ui-virtualization/commit/2eadedefc9a3f785eec56518f21eb9a5e5784a6f))
  * issue when scrolled to bottom and new items added ([561e1422](http://github.com/aurelia/ui-virtualization/commit/561e142258e607c98f7b919c624d4e444c7909a8))
  * set isLastIndex to false on detached ([4ff76899](http://github.com/aurelia/ui-virtualization/commit/4ff76899ed2e781cdd072d2c0f6e133f788c9a15))
  * reset sizes on deteched ([cdee18db](http://github.com/aurelia/ui-virtualization/commit/cdee18db44a53d5460f7d8ed5c7581b31e1ed581))
  * sync scroll margin with scroll animation ([e9a27a60](http://github.com/aurelia/ui-virtualization/commit/e9a27a6085d89aaf7615a9dee6efbfafd69f62f3))


#### Features

* **all:**
  * introduce strategy pattern ([b8f23ea1](http://github.com/aurelia/ui-virtualization/commit/b8f23ea18ff292620b857c2ba461b744c3dd6b87))
  * update to use override context ([0e0f3e65](http://github.com/aurelia/ui-virtualization/commit/0e0f3e65529d455544f820e96e940bf084c8ce84))
* **virtual-repeat:**
  * implement native scrolling ([dc486a9e](http://github.com/aurelia/ui-virtualization/commit/dc486a9ee43d7f7e4893f688d8be2b56b5910b4c), closes [#14](http://github.com/aurelia/ui-virtualization/issues/14))
  * add support for iterating tables ([54ad2fb8](http://github.com/aurelia/ui-virtualization/commit/54ad2fb8b08ffa4d0a0999b38554505896a00571))
  * handle instance change ([9aae0112](http://github.com/aurelia/ui-virtualization/commit/9aae011272b7b8ba55a68ef471701e084a26778b))
  * handle changes better ([69814309](http://github.com/aurelia/ui-virtualization/commit/69814309909385fb9a7c58e1ba42af75b4a35f7c), closes [#19](http://github.com/aurelia/ui-virtualization/issues/19))


### 0.3.1 (2015-11-16)


#### Features

* **all:** update to use override context ([0e0f3e65](http://github.com/aurelia/ui-virtualization/commit/0e0f3e65529d455544f820e96e940bf084c8ce84))


## 0.3.0 (2015-11-16)


## 0.2.0 (2015-11-10)


#### Bug Fixes

* **index:** update to latest configuration api ([f87a32dc](http://github.com/aurelia/ui-virtualization/commit/f87a32dc04c3be06ba2d7add0aebeb69204fa9ea))
* **virtual-list:** remove css class ([3d282b29](http://github.com/aurelia/ui-virtualization/commit/3d282b29393f1bb9719b5a2af23b0f1d21038f47))
* **virtual-repeat:**
  * update to latest templating ([62eb8490](http://github.com/aurelia/ui-virtualization/commit/62eb849032babb151127a1c21e217519ce7912f6))
  * update executionContext to bindingContext ([e29c46f0](http://github.com/aurelia/ui-virtualization/commit/e29c46f0ea552d42701239fa00be32ca244d7bad))
  * use parentNode instead of parentElement on the injected element ([66d05bbe](http://github.com/aurelia/ui-virtualization/commit/66d05bbe8f556ce96b950b11930b140b553b182d), closes [#4](http://github.com/aurelia/ui-virtualization/issues/4))


#### Features

* **all:**
  * handle home, end, pgup, pgdown keys ([9c27a091](http://github.com/aurelia/ui-virtualization/commit/9c27a0911cf3090bae6682e84b82dd554f4d4a81), closes [#10](http://github.com/aurelia/ui-virtualization/issues/10))
  * add initial implementation ([58cae757](http://github.com/aurelia/ui-virtualization/commit/58cae757f29abc0974ffdae3df32e85e15c8798d))
* **sample:** add ui-virtualization demo ([644bbe33](http://github.com/aurelia/ui-virtualization/commit/644bbe33e74247086f58081dbcfee191bc196e69), closes [#17](http://github.com/aurelia/ui-virtualization/issues/17))
