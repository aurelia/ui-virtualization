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

